'use client';

import { useEffect, useRef, useState } from 'react';

type Controller = {
  pause: () => void;
  resume: () => void;
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
  // the top/bottom edge of the viewport. Pulled inward from [0.5, 1.25] so the
  // black reaches a little further toward the centre.
  vignette: [0.4, 1.1],
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

  if (coarse || w < 768) {
    return { resolution: lowEnd ? 192 : 256, dprCap: 1.25, maxFps: 30, stepEvery: 2 };
  }
  if (w < 1280) {
    return { resolution: 384, dprCap: 1.5, maxFps: 60, stepEvery: 3 };
  }
  return { resolution: lowEnd ? 384 : 512, dprCap: 2, stepEvery: 3 };
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

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || typeof window.matchMedia !== 'function') return;

    const wantsDebug = new URLSearchParams(window.location.search).get('water') === 'debug';
    // Deferred so the overlay never sets state synchronously inside the effect;
    // every other report already arrives via an async callback.
    const report = (msg: string) => {
      if (wantsDebug) queueMicrotask(() => setDebug(msg));
    };

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      report('off · prefers-reduced-motion');
      return;
    }

    let controller: Controller | undefined;
    let cancelled = false;

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

    loadScript()
      .then(() => {
        if (cancelled) return;
        const start = (window as unknown as { startRipples?: StartRipples }).startRipples;
        if (typeof start !== 'function') return;
        try {
          controller = start(canvas, { ...BASE, ...tuneForDevice() });
          if (controller) {
            const cfg = tuneForDevice();
            report(
              `${controller.mode} · ${controller.reason ?? '—'} · sim ${cfg.resolution} · dpr ` +
                `${Math.min(window.devicePixelRatio || 1, Number(cfg.dprCap)).toFixed(2)} · ` +
                `${window.innerWidth}×${window.innerHeight}`,
            );
          }
        } catch {
          /* no WebGL2 → CSS pool shows through */
          report('threw during start');
        }
      })
      .catch(() => {
        report('ripples.js failed to load');
      });

    const onVisibility = () => {
      if (!controller) return;
      if (document.hidden) controller.pause();
      else controller.resume();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      controller?.destroy();
    };
  }, []);

  return (
    <>
      <canvas ref={ref} className="fluid-canvas" aria-hidden />
      {debug ? (
        <output className="fixed bottom-2 left-2 z-50 rounded bg-black/80 px-2 py-1 font-mono text-[11px] text-blue-200">
          water: {debug}
        </output>
      ) : null}
    </>
  );
}
