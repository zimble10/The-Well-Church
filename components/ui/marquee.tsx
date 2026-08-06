'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Seamless infinite ticker. Measures one pass of `items`, repeats it enough to
 * overfill the container (plus one), and translates the track by exactly one
 * group's pixel width — so it loops with no gap at ANY viewport size. Re-measures
 * on resize (ResizeObserver) and after web fonts load.
 */
export function Marquee({ items, speed = 70 }: { items: string[]; speed?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [group, setGroup] = useState<string[]>(items);
  const [shift, setShift] = useState(0);
  const [duration, setDuration] = useState(24);

  useEffect(() => {
    const container = containerRef.current;
    const measure = measureRef.current;
    if (!container || !measure) return;

    const recompute = () => {
      const oneSet = measure.scrollWidth; // width of a single pass of `items`
      const cw = container.offsetWidth;
      if (!oneSet || !cw) return;
      const reps = Math.max(1, Math.ceil(cw / oneSet) + 1);
      const groupW = oneSet * reps;
      setGroup(Array.from({ length: reps }, () => items).flat());
      setShift(groupW);
      setDuration(groupW / speed); // constant pixels/second regardless of width
    };

    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(container);
    ro.observe(measure); // fires when the web font swaps in and widths change
    if ('fonts' in document) void document.fonts.ready.then(recompute);
    return () => ro.disconnect();
  }, [items, speed]);

  const units = (arr: string[], prefix: string) =>
    arr.map((item, i) => (
      <span key={`${prefix}-${i}`} className="marquee-unit">
        <span className="font-display text-paper/80 text-2xl italic">{item}</span>
        <span className="text-metal text-xl" aria-hidden>
          ✦
        </span>
      </span>
    ));

  return (
    <div
      ref={containerRef}
      className="border-ink-line relative overflow-hidden border-y py-5 select-none"
    >
      {/* hidden one-pass measurer (same markup as a unit → exact widths) */}
      <div ref={measureRef} className="marquee-measure" aria-hidden>
        {units(items, 'm')}
      </div>

      <div
        className="marquee-track"
        style={
          { '--shift': `${shift}px`, animationDuration: `${duration}s` } as React.CSSProperties
        }
      >
        <div className="marquee-group">{units(group, 'a')}</div>
        <div className="marquee-group" aria-hidden>
          {units(group, 'b')}
        </div>
      </div>

      {/* edge fades */}
      <div className="from-ink pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r to-transparent" />
      <div className="from-ink pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l to-transparent" />
    </div>
  );
}
