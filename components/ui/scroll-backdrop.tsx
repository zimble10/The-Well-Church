'use client';

import { useEffect } from 'react';

/**
 * Renders the fixed "well" backdrop (`.site-bg`) and drives `--swirl` from scroll
 * velocity: scrolling ramps the pool's swirl up; when you stop, it eases back to
 * 0 and the water settles to just its (always-on) shimmer. The shimmer itself is
 * pure CSS/SVG and needs no JS.
 */
export function ScrollBackdrop() {
  useEffect(() => {
    const root = document.documentElement;
    const reduce =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return; // keep the calm shimmer only

    let lastY = window.scrollY;
    let target = 0; // where swirl wants to be (fed by scroll velocity)
    let cur = 0; // eased current value written to --swirl
    let raf = 0;

    const tick = () => {
      target *= 0.9; // decay toward calm when not scrolling
      cur += (target - cur) * 0.12; // ease current toward target
      if (cur < 0.001 && target < 0.001) {
        cur = 0;
        root.style.setProperty('--swirl', '0');
        raf = 0; // settled — stop the loop until the next scroll
        return;
      }
      root.style.setProperty('--swirl', cur.toFixed(3));
      raf = requestAnimationFrame(tick);
    };

    const onScroll = () => {
      const y = window.scrollY;
      const v = Math.min(1, Math.abs(y - lastY) / 55); // velocity → 0..1
      lastY = y;
      target = Math.min(1, target + v * 0.7);
      if (!raf) raf = requestAnimationFrame(tick);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return <div className="site-bg" aria-hidden />;
}
