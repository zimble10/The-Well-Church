import Link from 'next/link';
import type { ReactNode } from 'react';

/** Primary/ghost call-to-action link with the signature arrow. */
export function Cta({
  href,
  children,
  variant = 'metal',
  arrow = '→',
  external = false,
}: {
  href: string;
  children: ReactNode;
  variant?: 'metal' | 'ghost';
  arrow?: '→' | '↓' | null;
  external?: boolean;
}) {
  const className = variant === 'metal' ? 'btn-metal' : 'btn-ghost';
  const content = (
    <>
      <span>{children}</span>
      {arrow && <span aria-hidden>{arrow}</span>}
    </>
  );
  if (external) {
    return (
      <a href={href} className={className} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}
