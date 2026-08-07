'use client';

import { useEffect, useRef } from 'react';

type FluidController = { pause: () => void; resume: () => void; destroy: () => void };
type StartFluid = (canvas: HTMLCanvasElement, cfg: Record<string, unknown>) => FluidController;

/** Tuned to the church palette: dark-blue pool, blue/silver splats, calm flow. */
const CONFIG: Record<string, unknown> = {
  BACK_COLOR: { r: 5, g: 14, b: 30 },
  TRANSPARENT: false,
  COLORFUL: false,
  SHADING: true,
  BLOOM: true,
  BLOOM_INTENSITY: 0.6,
  SUNRAYS: true,
  SUNRAYS_WEIGHT: 0.8,
  CURL: 22,
  DENSITY_DISSIPATION: 1.4,
  VELOCITY_DISSIPATION: 0.3,
  SPLAT_RADIUS: 0.2,
  SIM_RESOLUTION: 128,
  DYE_RESOLUTION: 768,
};

/**
 * Interactive WebGL water in the well's pool — PavelDoGreat's fluid simulation
 * (MIT, see NOTICE), adapted in /public/fluid.js. DESKTOP ONLY: mobile, touch,
 * and reduced-motion users get the CSS pool instead. Pauses while the tab is
 * hidden to save the GPU.
 */
export function FluidBackground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || typeof window.matchMedia !== 'function') return;

    const desktop =
      window.matchMedia('(hover: hover) and (pointer: fine)').matches && window.innerWidth >= 1024;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!desktop || reduce) return; // → CSS fallback pool

    let controller: FluidController | undefined;
    let cancelled = false;

    const loadScript = () =>
      new Promise<void>((resolve, reject) => {
        if (typeof (window as unknown as { startFluid?: unknown }).startFluid === 'function') {
          resolve();
          return;
        }
        const existing = document.querySelector<HTMLScriptElement>('script[data-fluid]');
        if (existing) {
          existing.addEventListener('load', () => resolve());
          existing.addEventListener('error', () => reject(new Error('fluid')));
          return;
        }
        const s = document.createElement('script');
        s.src = '/fluid.js';
        s.async = true;
        s.dataset.fluid = 'true';
        s.onload = () => resolve();
        s.onerror = () => reject(new Error('fluid'));
        document.body.appendChild(s);
      });

    loadScript()
      .then(() => {
        if (cancelled) return;
        const start = (window as unknown as { startFluid?: StartFluid }).startFluid;
        if (typeof start !== 'function') return;
        try {
          controller = start(canvas, CONFIG);
        } catch {
          /* no WebGL → canvas stays blank, CSS pool shows through */
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
