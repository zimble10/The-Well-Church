import type { Metadata } from 'next';
import { PageHero } from '@/components/sections/page-hero';
import { SectionLabel } from '@/components/ui/section-label';
import { Reveal } from '@/components/ui/reveal';
import { Cta } from '@/components/ui/cta';
import { ComingSoonBadge } from '@/components/ui/coming-soon';

export const metadata: Metadata = {
  title: 'Give',
  description:
    'Give to The Well Church in Henderson, NV. Secure online giving, recurring gifts, and generosity that fuels the mission.',
};

const gifts = [
  ['One-Time', 'A single secure gift, any amount.'],
  ['Recurring', 'Automate weekly or monthly generosity.'],
  ['Text-to-Give', 'Give in seconds from your phone.'],
];

export default function GivePage() {
  return (
    <>
      <PageHero
        index={6}
        eyebrow="Give"
        title="Generosity fuels the mission."
        intro="Thank you for partnering with The Well. Your giving makes room for more people to be loved, discipled, and sent — right here in Henderson and beyond."
      />

      {/* Giving widget placeholder */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-12 md:grid-cols-[1fr_1.1fr] md:items-center">
          <Reveal>
            <div>
              <SectionLabel index={1}>Ways to Give</SectionLabel>
              <ul className="mt-8 space-y-px">
                {gifts.map(([name, blurb]) => (
                  <li key={name} className="rule-soft grid grid-cols-[auto_1fr] gap-5 py-6">
                    <span className="bg-metal mt-2 h-2 w-2 rounded-full" />
                    <div>
                      <p className="font-display text-2xl">{name}</p>
                      <p className="text-paper-muted mt-1 text-sm leading-relaxed">{blurb}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="text-paper-muted mt-8 max-w-md text-sm leading-relaxed">
                Every gift is processed securely — the church never handles raw card data, and
                donations go directly to The Well Church.
              </p>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="card relative overflow-hidden p-10 text-center">
              <div className="mesh-glow" />
              <div className="relative">
                <ComingSoonBadge className="mx-auto" />
                <p className="font-display mt-8 text-3xl">Secure Giving</p>
                <p className="text-paper-muted mx-auto mt-3 max-w-xs text-sm leading-relaxed">
                  The live giving form connects to the church’s payment processor at launch.
                </p>

                {/* Illustrative amount chips */}
                <div className="mt-8 grid grid-cols-3 gap-3">
                  {['$25', '$50', '$100', '$250', '$500', 'Other'].map((amt) => (
                    <span
                      key={amt}
                      className="border-ink-line text-paper-muted rounded-lg border px-4 py-3 font-mono text-sm"
                    >
                      {amt}
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  disabled
                  className="btn-metal mt-6 w-full cursor-not-allowed justify-center opacity-80"
                >
                  Give Securely →
                </button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Watch online band */}
      <section>
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <Reveal>
            <SectionLabel index={2}>Watch Online</SectionLabel>
            <h2 className="mt-6 text-4xl sm:text-5xl">
              Can’t make it in person? <span className="text-metal">Worship with us live.</span>
            </h2>
            <p className="text-paper-muted mx-auto mt-6 max-w-lg leading-relaxed">
              Join the 10:00 AM livestream, or catch up any time on the web and through The Well app
              — iOS, Android, Amazon Fire, and Roku.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <span className="btn-ghost cursor-not-allowed opacity-80">
                Watch Live <ComingSoonBadge className="ml-1" />
              </span>
              <Cta href="/connect" variant="metal">
                Plan Your Visit
              </Cta>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
