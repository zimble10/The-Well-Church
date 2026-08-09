import Link from 'next/link';
import Image from 'next/image';
import { church, nav, serviceTimes, apps } from '@/lib/site';

export function SiteFooter() {
  return (
    <footer className="border-ink-line/70 relative border-t">
      <div className="relative mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          {/* Brand + address */}
          <div>
            <Link href="/" className="flex items-center gap-3">
              {/* Same treatment as the header: no ring, and the solid #000 disc
                  feathered into the background instead of ending at a hard
                  circular edge. Size left alone — only the header mark grows. */}
              <Image
                src="/logo.png"
                alt="The Well Church"
                width={48}
                height={48}
                className="h-12 w-12 [mask-image:radial-gradient(circle,#000_68%,transparent_86%)]"
              />
              <span className="font-display text-xl">The Well Church</span>
            </Link>
            <p className="text-metal font-display mt-5 text-lg italic">{church.tagline}</p>
            <address className="text-paper-muted mt-5 space-y-1 text-sm not-italic">
              <p>{church.address.street}</p>
              <p>{church.address.cityStateZip}</p>
              <p>
                <a href={church.phoneHref} className="hover:text-paper transition-colors">
                  {church.phone}
                </a>
              </p>
            </address>
          </div>

          {/* Explore */}
          <div>
            <p className="eyebrow">Explore</p>
            <ul className="mt-5 space-y-3">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-paper-muted hover:text-paper text-sm transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Sundays + watch */}
          <div>
            <p className="eyebrow">Sundays</p>
            <ul className="text-paper-muted mt-5 space-y-2 text-sm">
              {serviceTimes.inPerson.map((t) => (
                <li key={t}>{t}</li>
              ))}
              <li className="text-blue-300">{serviceTimes.online} online</li>
            </ul>
            <p className="eyebrow mt-8">Watch Anywhere</p>
            <p className="text-paper-muted mt-4 font-mono text-xs tracking-wide">
              {apps.join(' · ')}
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-ink-line/60 mt-14 flex flex-col items-center justify-between gap-4 border-t pt-8 sm:flex-row">
          <p className="text-paper-dim font-mono text-[0.7rem] tracking-wide">
            © {new Date().getFullYear()} The Well Church · Henderson, NV
          </p>
          <div className="flex items-center gap-5">
            {(
              [
                ['Facebook', church.social.facebook],
                ['Instagram', church.social.instagram],
                ['YouTube', church.social.youtube],
              ] as const
            ).map(([label, href]) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-paper-muted font-mono text-[0.7rem] tracking-widest uppercase transition-colors hover:text-blue-200"
              >
                {label}
              </a>
            ))}
          </div>
        </div>

        {/* Demo watermark — honest about status during the pitch */}
        <p className="text-paper-dim mt-8 text-center font-mono text-[0.62rem] tracking-wider">
          Concept demo · built by 7LSM Marketing · not the church’s live site
        </p>
      </div>
    </footer>
  );
}
