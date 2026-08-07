'use client';

import { useEffect, useRef } from 'react';

type Controller = { pause: () => void; resume: () => void; destroy: () => void };
type StartRipples = (canvas: HTMLCanvasElement, cfg: Record<string, unknown>) => Controller;

/** Water tuned to the well: dark-blue pool, gentle ambient ripples, light glints. */
const CONFIG: Record<string, unknown> = {
  resolution: 512,
  damping: 0.997, // high → soft, slow-rolling ripples that persist
  deep: [0.01, 0.035, 0.075],
  shallow: [0.06, 0.17, 0.3],
  lightPos: [0.5, 0.5],
  // Gentle rings from the centre (behind the logo), softly expanding outward.
  centerX: 0.5,
  centerY: 0.5,
  dropRadius: 0.055,
  dropStrength: 0.11,
  dropInterval: 900,
  cursorRadius: 0.035,
  cursorStrength: 0.06,
};

/**
 * Interactive WebGL water ripples in the well's pool (custom heightfield sim in
 * /public/ripples.js). DESKTOP ONLY — mobile / touch / reduced-motion / no-WebGL2
 * fall back to the CSS pool. Pauses while the tab is hidden.
 */
export function WaterBackground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || typeof window.matchMedia !== 'function') return;

    const desktop =
      window.matchMedia('(hover: hover) and (pointer: fine)').matches && window.innerWidth >= 1024;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!desktop || reduce) return;

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
          controller = start(canvas, CONFIG);
        } catch {
          /* no WebGL2 → CSS pool shows through */
        }
      })
      .catch(() => {});

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

  return <canvas ref={ref} className="fluid-canvas" aria-hidden />;
}
