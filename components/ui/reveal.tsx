'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Fades + lifts children into view on scroll. Respects reduced-motion via CSS
 * (see .reveal in globals.css). Safe for static export — pure client behavior.
 */
export function Reveal({
  children,
  delay = 0,
  as: Tag = 'div',
  className = '',
}: {
  children: ReactNode;
  delay?: number;
  as?: 'div' | 'section' | 'li' | 'span';
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      /*
       * Fire as soon as the element's leading edge crosses into view, rather
       * than waiting for 12% of it to be showing. On a tall section that 12%
       * could be a couple of hundred pixels, so the fade started well after the
       * section was already on screen and you watched it animate. Starting at
       * the edge means it has settled by the time it holds your attention,
       * which is what reads as subtle.
       */
      { threshold: 0, rootMargin: '0px 0px -6% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const Component = Tag as React.ElementType;
  return (
    <Component
      ref={ref}
      className={`reveal ${visible ? 'is-visible' : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Component>
  );
}
