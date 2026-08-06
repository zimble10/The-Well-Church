'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

/**
 * Fixed, stationary "stage" that shows a large, faint image behind whichever
 * staged section is currently most in view — cross-fading from one section's
 * image to the next as you scroll.
 *
 * `images` lists every image that can appear (rendered as stacked layers).
 * Any element tagged `data-stage-src="/path.png"` (matching one of `images`)
 * becomes the trigger for that layer. This is how the logo and (later) real
 * church photos plug in per section. Sits above the metallic backdrop, below content.
 */
export function SectionStage({ images }: { images: readonly string[] }) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-stage-src]'));
    if (nodes.length === 0) return;

    const ratios = new Map<Element, number>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) ratios.set(e.target, e.intersectionRatio);
        // active = the staged section with the greatest visible area (min presence 20%)
        let best: string | null = null;
        let bestRatio = 0.2;
        for (const [el, r] of ratios) {
          if (r > bestRatio) {
            bestRatio = r;
            best = (el as HTMLElement).dataset.stageSrc ?? null;
          }
        }
        setActive(best);
      },
      { threshold: [0, 0.2, 0.4, 0.6, 0.8, 1] },
    );

    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);

  if (images.length === 0) return null;

  return (
    <div className="section-stage" aria-hidden>
      {images.map((src) => (
        <div key={src} className="section-stage-cell" data-active={active === src}>
          <div className="section-stage-frame">
            <Image src={src} alt="" fill sizes="70vw" className="object-contain" />
          </div>
        </div>
      ))}
    </div>
  );
}
