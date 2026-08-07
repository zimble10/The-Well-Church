import type { Metadata } from 'next';
import { Fraunces, Newsreader, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { ScrollBackdrop } from '@/components/ui/scroll-backdrop';
import { FluidBackground } from '@/components/ui/fluid-background';

// Display serif — high-contrast, characterful (headings, hero).
const fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
  display: 'swap',
});

// Body serif — elegant, readable long-form.
const newsreader = Newsreader({
  variable: '--font-newsreader',
  subsets: ['latin'],
  display: 'swap',
  style: ['normal', 'italic'],
});

// Mono — section numbers (§01), labels, spec-sheet accents.
const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains',
  subsets: ['latin'],
  display: 'swap',
});

const SITE_URL = 'https://thewell-demo.pages.dev';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'The Well Church — Henderson, NV',
    template: '%s | The Well Church',
  },
  description:
    'The Well Church in Henderson, Nevada — Loving People, Teaching Truth. Join us Sundays at 8:30, 10:00 & 11:30 AM for worship, or watch online.',
  openGraph: {
    title: 'The Well Church — Henderson, NV',
    description: 'Loving People, Teaching Truth. Sundays in Henderson, Nevada.',
    url: SITE_URL,
    siteName: 'The Well Church',
    locale: 'en_US',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${newsreader.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="bg-ink text-paper flex min-h-full flex-col">
        <ScrollBackdrop />
        <FluidBackground />
        <SiteHeader />
        {/* overflow-x-clip: safety net so no section can cause horizontal scroll */}
        <main className="flex-1 overflow-x-clip">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
