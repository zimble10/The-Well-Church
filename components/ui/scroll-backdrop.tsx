'use client';

import { useEffect } from 'react';

/**
 * Renders the fixed, full-viewport metallic backdrop (black · steel-blue ·
 * graphite-silver) and drives its gradient position from scroll progress.
 *
 * Legibility: the gradient bands are all intentionally dark (graphite, not bright
 * silver) so cream/blue text stays high-contrast at every scroll position. The
 * bright "silver" only appears as a low-opacity traveling sheen (see .site-bg).
 *
 * `--scroll` (0→1) is written to the root element; CSS maps it to background-position.
 * SSR/no-JS safe: the backdrop renders a valid static gradient at --scroll:0.
 * Reduced-motion: we freeze --scroll so nothing shifts on scroll.
 */
export function ScrollBackdrop() {
  useEffect(() => {
    const root = document.documentElement;

    const reduce =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduce) {
      root.style.setProperty('--scroll', '0.4');
      return;
    }

    let raf = 0;
    const update = () => {
      raf = 0;
      const max = root.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      root.style.setProperty('--scroll', p.toFixed(4));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return <div className="site-bg" aria-hidden />;
}
