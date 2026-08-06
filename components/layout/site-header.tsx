'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { nav, church } from '@/lib/site';

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-ink-line/70 bg-ink/70 sticky top-0 z-50 border-b backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        {/* Brand */}
        <Link href="/" className="group flex items-center gap-4" onClick={() => setOpen(false)}>
          <Image
            src="/logo.png"
            alt="The Well Church"
            width={56}
            height={56}
            className="h-14 w-14 rounded-full ring-1 ring-blue-800/40 transition group-hover:ring-blue-500/60"
            priority
          />
          <span className="font-display hidden text-2xl leading-none tracking-tight sm:block">
            The Well
            <span className="text-paper-muted"> Church</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-9 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-paper-muted hover:text-paper font-mono text-sm tracking-widest uppercase transition-colors"
            >
              {item.label}
            </Link>
          ))}
          <Link href="/connect" className="btn-metal !px-5 !py-2.5 !text-xs">
            Plan Your Visit <span aria-hidden>→</span>
          </Link>
        </nav>

        {/* Mobile toggle */}
        <button
          type="button"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="text-paper flex h-10 w-10 items-center justify-center md:hidden"
        >
          <div className="relative h-4 w-6">
            <span
              className={`bg-paper absolute left-0 h-0.5 w-6 transition-all ${open ? 'top-1.5 rotate-45' : 'top-0'}`}
            />
            <span
              className={`bg-paper absolute top-1.5 left-0 h-0.5 w-6 transition-all ${open ? 'opacity-0' : 'opacity-100'}`}
            />
            <span
              className={`bg-paper absolute left-0 h-0.5 w-6 transition-all ${open ? 'top-1.5 -rotate-45' : 'top-3'}`}
            />
          </div>
        </button>
      </div>

      {/* Mobile panel */}
      {open && (
        <nav className="border-ink-line/70 bg-ink/95 border-t px-6 py-6 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="text-paper border-ink-line/50 border-b py-3 font-mono text-sm tracking-widest uppercase hover:text-blue-200"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <Link
            href="/connect"
            onClick={() => setOpen(false)}
            className="btn-metal mt-6 w-full justify-center"
          >
            Plan Your Visit <span aria-hidden>→</span>
          </Link>
          <a
            href={church.phoneHref}
            className="text-paper-muted mt-4 block text-center font-mono text-xs"
          >
            {church.phone}
          </a>
        </nav>
      )}
    </header>
  );
}
