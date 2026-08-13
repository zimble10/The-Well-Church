'use client';

import { useEffect, useRef, useState } from 'react';

type Controller = {
  pause: (reason?: string) => void;
  resume: (reason?: string) => void;
  destroy: () => void;
  mode: 'webgl' | 'canvas' | 'none';
  reason: string | null;
};
type StartRipples = (canvas: HTMLCanvasElement, cfg: Record<string, unknown>) => Controller;

/** Water tuned to the well: dark-blue pool, gentle ambient ripples, light glints. */
const BASE: Record<string, unknown> = {
  damping: 0.997, // high → soft, slow-rolling ripples that persist
  deep: [0.01, 0.035, 0.075],
  shallow: [0.06, 0.17, 0.3],
  lightPos: [0.5, 0.5],
  // Ripples travel outward at half the original speed. Implemented as a wave
  // speed inside the sim rather than by stepping less often, so the motion stays
  // smooth instead of stuttering. Reach is preserved automatically (see ripples.js).
  waveSpeed: 0.5,
  // Radii at which the water goes from fully opaque to fully faded, where 1.0 is
  // the top/bottom edge of the viewport.
  //
  // The outer value MUST stay below 1.0. The falloff has always been a circle,
  // but at 1.1 it finished beyond the top and bottom edges, so the black only
  // ever closed at the sides — which reads as two dark bands flanking a strip of
  // water, not as a well. Ending at 0.82 closes the ring above and below too, so
  // the water becomes a circular opening with black all the way around it.
  vignette: [0.3, 0.82],
  // Gentle rings from the centre (behind the logo), softly expanding outward.
  centerX: 0.5,
  centerY: 0.5,
  dropRadius: 0.055,
  dropStrength: 0.11,
  // Doubled alongside waveSpeed. Ring spacing is speed × interval, so leaving
  // this at 900 while halving the speed would have packed the rings twice as
  // densely — a different look, not just a slower one.
  dropInterval: 1800,
  cursorRadius: 0.035,
  cursorStrength: 0.06,
};

/**
 * Simulation cost scales with resolution² × devicePixelRatio², so a phone gets a
 * smaller grid and a lower pixel cap rather than being switched off entirely.
 * A 3× DPR phone rendering a 512² sim at full density is what made this feel
 * like it had to be desktop-only; it never did.
 */
function tuneForDevice(): Record<string, unknown> {
  const w = window.innerWidth;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const cores = navigator.hardwareConcurrency ?? 4;
  const lowEnd = cores <= 4;

  // stepHz 20 on every tier: sim stepping is wall-clock-based in ripples.js,
  // so the water moves at the same speed on a 30fps phone, a 60fps laptop and
  // a 144Hz monitor. (The old per-frame stepEvery gave phones visibly slower
  // water — 15 steps/s against the desktop's 20.)
  if (coarse || w < 768) {
    return {
      resolution: lowEnd ? 192 : 256,
      dprCap: 1.25,
      maxFps: 30,
      stepHz: 20,
      // A decorative background should never claim a phone's fast GPU core.
      // Advisory — some browsers ignore it — and deliberately not set on the
      // desktop tiers, where forcing the iGPU is a choice the browser makes
      // better than we can.
      powerPreference: 'low-power',
      // Scrolling retracts the browser chrome and changes the viewport height
      // without the user resizing anything. See applySize in ripples.js.
      ignoreChromeJitter: true,
    };
  }
  if (w < 1280) {
    return { resolution: 384, dprCap: 1.5, maxFps: 60, stepHz: 20 };
  }
  /*
   * dprCap 1.5 rather than 2. Fragment cost scales with the SQUARE of the pixel
   * ratio, so 2 costs ~78% more than 1.5 — and on a high-DPI laptop panel that
   * is the difference between comfortable and hot. This effect is soft, blurred
   * water with no fine detail to lose, which is precisely the kind of content
   * that does not repay rendering at full device resolution.
   */
  /*
   * maxFps 60 even on high-refresh displays. Uncapped, a 120Hz monitor ran the
   * whole pipeline twice as often for no visible gain — soft slow water has
   * nothing that reads better at 120 — and, before sim stepping became
   * time-based, it also made the water MOVE at double speed there.
   */
  return { resolution: lowEnd ? 384 : 512, dprCap: 1.5, maxFps: 60, stepHz: 20 };
}

/**
 * Interactive WebGL water ripples in the well's pool (heightfield sim in
 * /public/ripples.js), with a 2D ring fallback for devices without WebGL2 or
 * float render targets.
 *
 * This runs on EVERY device, phones included — only `prefers-reduced-motion`
 * opts out. It previously required a fine pointer and a ≥1024px window, which
 * silently excluded every phone and tablet from the site's signature element.
 *
 * Append `?water=debug` to any URL to see which path the device took.
 */
export function WaterBackground() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [debug, setDebug] = useState<string | null>(null);
  const [gen, setGen] = useState(0);

  /*
   * prefers-reduced-motion is honoured LIVE by remounting the canvas: `gen`
   * keys the element, so flipping the OS setting tears the whole thing down
   * and builds it fresh. A same-element restart cannot work — destroy() ends
   * with WEBGL_lose_context.loseContext() to free GPU memory, and a canvas
   * whose context was force-lost hands back the same dead context forever
   * (getContext('2d') on it returns null, so even the ring fallback dies).
   * Only a new element gets a live context.
   */
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setGen((g) => g + 1);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || typeof window.matchMedia !== 'function') return;

    const wantsDebug = new URLSearchParams(window.location.search).get('water') === 'debug';
    // Deferred so the overlay never sets state synchronously inside the effect;
    // every other report already arrives via an async callback.
    const report = (msg: string) => {
      if (wantsDebug) queueMicrotask(() => setDebug(msg));
    };

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      report('off · prefers-reduced-motion');
      return;
    }

    let controller: Controller | undefined;
    let cancelled = false;
    let scrolledAway = false;
    // The tier/mode part of the debug line; live pause/sleep state is appended.
    const baseReport = { current: '' };

    const loadScript = () =>
      new Promise<void>((resolve, reject) => {
        if (typeof (window as unknown as { startRipples?: unknown }).startRipples === 'function') {
          resolve();
          return;
        }
        const existing = document.querySelector<HTMLScriptElement>('script[data-ripples]');
        if (existing) {
          existing.addEventListener('load', () => resolve());
          existing.addEventListener('error', () => reject(new Error('ripples')));
          return;
        }
        const s = document.createElement('script');
        s.src = '/ripples.js';
        s.async = true;
        s.dataset.ripples = 'true';
        s.onload = () => resolve();
        s.onerror = () => reject(new Error('ripples'));
        document.body.appendChild(s);
      });

    const boot = async () => {
      try {
        await loadScript();
      } catch {
        report('ripples.js failed to load');
        return;
      }
      if (cancelled) return;
      const start = (window as unknown as { startRipples?: StartRipples }).startRipples;
      if (typeof start !== 'function') return;
      const tuned = tuneForDevice();
      try {
        controller = start(canvas, {
          ...BASE,
          ...tuned,
          onStateChange: wantsDebug
            ? (state: string) => report(`${baseReport.current} · ${state}`)
            : undefined,
        });
      } catch {
        /* no WebGL2 → CSS pool shows through */
        report('threw during start');
        return;
      }
      if (!controller) return;
      baseReport.current =
        `${controller.mode} · ${controller.reason ?? '—'} · sim ${tuned.resolution} · dpr ` +
        `${Math.min(window.devicePixelRatio || 1, Number(tuned.dprCap)).toFixed(2)} · ` +
        `${window.innerWidth}×${window.innerHeight}`;
      report(baseReport.current);
      // The script loads asynchronously — the user may have scrolled past the
      // pool or backgrounded the tab before start() ever ran. Apply the
      // current reality to the fresh controller instead of assuming "awake".
      if (document.hidden) controller.pause('hidden');
      if (scrolledAway) controller.pause('offscreen');
    };

    const onVisibility = () => {
      if (!controller) return;
      if (document.hidden) controller.pause('hidden');
      else controller.resume('hidden');
    };
    document.addEventListener('visibilitychange', onVisibility);

    /*
     * The canvas is position:fixed behind everything, so once the reader has
     * scrolled into the page's content the water is almost entirely occluded —
     * yet it kept rendering at full cost. Simply pausing it looked wrong: any
     * water still peeking through the content visibly froze mid-ripple. So the
     * canvas FADES with scroll instead — full water through the first viewport,
     * dissolving into the CSS pool underneath (which carries its own gentle
     * shimmer) across the next three-quarters — and the sim is paused only
     * once the canvas is fully transparent, where stopping is invisible. The
     * scroll-linked opacity needs no CSS transition: it tracks the scroll
     * position itself, so it is exactly as smooth as the reader's scrolling.
     * The pause/resume thresholds both sit in the opacity-0 region, so their
     * dead band can never show.
     *
     * Over the same range, the CSS pool underneath (.site-bg, rendered by
     * ScrollBackdrop) scales UP: its dark circular gradient expands outward,
     * so the walls of the well recede and the page brightens as the water
     * hands off to it. Driven from this one listener rather than a second one
     * in ScrollBackdrop so the two motions can never drift apart, and done
     * with a transform so the gradient is never repainted — the whole layer
     * (gradient, black surround, shimmer) scales on the compositor.
     */
    const FADE_START = 1.0; // viewports scrolled where the fade begins
    const FADE_END = 1.75; // fully transparent from here on
    const PAUSE_AT = 1.9; // sim pauses (invisible — inside the faded region)
    const RESUME_AT = 1.75; // sim resumes as the fade zone re-approaches
    const POOL_SCALE_MAX = 1.8; // pool circle expansion once the water is gone
    const backdrop = document.querySelector<HTMLElement>('.site-bg');
    let lastOpacity = '';
    let lastScale = '';
    const onScroll = () => {
      const y = window.scrollY;
      const h = window.innerHeight;
      const t = (y / h - FADE_START) / (FADE_END - FADE_START);
      const opacity = t <= 0 ? '1' : t >= 1 ? '0' : String(1 - t);
      if (opacity !== lastOpacity) {
        lastOpacity = opacity;
        canvas.style.opacity = opacity;
      }
      if (backdrop) {
        const scale =
          t <= 0
            ? ''
            : t >= 1
              ? `scale(${POOL_SCALE_MAX})`
              : `scale(${(1 + (POOL_SCALE_MAX - 1) * t).toFixed(4)})`;
        if (scale !== lastScale) {
          lastScale = scale;
          backdrop.style.transform = scale;
        }
      }
      if (!scrolledAway && y > h * PAUSE_AT) {
        scrolledAway = true;
        controller?.pause('offscreen');
      } else if (scrolledAway && y < h * RESUME_AT) {
        scrolledAway = false;
        controller?.resume('offscreen');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // deep links / back-navigation restore scroll before we mount

    void boot();

    return () => {
      cancelled = true;
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVisibility);
      // The backdrop belongs to ScrollBackdrop and outlives this effect —
      // don't leave a stale mid-scroll scale on it.
      if (backdrop) backdrop.style.transform = '';
      controller?.destroy();
      controller = undefined;
    };
  }, [gen]);

  return (
    <>
      <canvas key={gen} ref={ref} className="fluid-canvas" aria-hidden />
      {debug ? (
        <output className="fixed bottom-2 left-2 z-50 rounded bg-black/80 px-2 py-1 font-mono text-[11px] text-blue-200">
          water: {debug}
        </output>
      ) : null}
    </>
  );
}
