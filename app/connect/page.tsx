import type { Metadata } from 'next';
import { PageHero } from '@/components/sections/page-hero';
import { SectionLabel } from '@/components/ui/section-label';
import { Reveal } from '@/components/ui/reveal';
import { ComingSoonBadge } from '@/components/ui/coming-soon';
import { church, serviceTimes } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Connect · Plan Your Visit',
  description:
    'Planning your first visit to The Well Church in Henderson, NV? Here’s everything you need to know, plus how to get in touch.',
};

const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(church.mapQuery)}&output=embed`;

export default function ConnectPage() {
  return (
    <>
      <PageHero
        index={4}
        eyebrow="Connect · Plan Your Visit"
        title="We’d love to meet you."
        intro="Walking into a new church can feel like a lot. Here’s exactly what to expect — so on Sunday, all you have to do is show up."
      />

      {/* What to expect */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-12 md:grid-cols-[1.1fr_1fr]">
          <Reveal>
            <div>
              <SectionLabel index={1}>What to Expect</SectionLabel>
              <div className="mt-8 space-y-8">
                {[
                  ['When', `Sundays · ${serviceTimes.inPerson.join(' · ')}`],
                  ['Where', `${church.address.street}, ${church.address.cityStateZip}`],
                  [
                    'How long',
                    'About 75 minutes — worship, a relevant message, and time to connect.',
                  ],
                  ['What to wear', 'Come as you are. Seriously — jeans are perfect.'],
                  ['Your kids', `Well Kids runs at every service, with secure check-in.`],
                ].map(([label, value]) => (
                  <div key={label} className="rule-soft grid grid-cols-[7rem_1fr] gap-4 pt-6">
                    <span className="text-paper-dim font-mono text-[0.7rem] tracking-widest uppercase">
                      {label}
                    </span>
                    <span className="text-paper leading-relaxed">{value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-10 flex flex-wrap gap-6">
                <a
                  href={church.phoneHref}
                  className="font-mono text-sm text-blue-300 hover:text-blue-200"
                >
                  {church.phone}
                </a>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(church.mapQuery)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-sm text-blue-300 hover:text-blue-200"
                >
                  Get Directions →
                </a>
              </div>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="card overflow-hidden">
              <iframe
                title="Map to The Well Church"
                src={mapSrc}
                loading="lazy"
                className="h-72 w-full contrast-110 grayscale-[0.2]"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <div className="p-6">
                <p className="font-display text-xl">The Well Church</p>
                <p className="text-paper-muted mt-1 text-sm">
                  {church.address.street}
                  <br />
                  {church.address.cityStateZip}
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Contact form (demo — not wired) */}
      <section>
        <div className="mx-auto max-w-3xl px-6 py-20">
          <Reveal>
            <div className="flex items-center justify-between gap-4">
              <SectionLabel index={2}>Say Hello</SectionLabel>
              <ComingSoonBadge />
            </div>
            <h2 className="mt-6 text-4xl sm:text-5xl">Have a question? Reach out.</h2>
            <p className="text-paper-muted mt-5 leading-relaxed">
              New here, need prayer, or want to get connected? Send us a note and someone from our
              team will follow up.
            </p>

            {/* Demo only — inputs are disabled; wires to the church inbox at launch. */}
            <form className="mt-10 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="First name" placeholder="Jordan" />
                <Field label="Last name" placeholder="Rivera" />
              </div>
              <Field label="Email" type="email" placeholder="you@email.com" />
              <div>
                <label className="text-paper-dim mb-2 block font-mono text-[0.7rem] tracking-widest uppercase">
                  How can we help?
                </label>
                <textarea
                  rows={4}
                  disabled
                  placeholder="I’m new and planning to visit this Sunday…"
                  className="border-ink-line bg-ink text-paper placeholder:text-paper-dim/70 w-full cursor-not-allowed rounded-lg border px-4 py-3 outline-none"
                />
              </div>
              <button
                type="button"
                disabled
                className="btn-metal w-full cursor-not-allowed justify-center opacity-80"
              >
                Send Message →
              </button>
              <p className="text-paper-dim text-center font-mono text-[0.68rem] tracking-wide">
                Form is illustrative in this demo — it will connect to the church’s inbox at launch.
              </p>
            </form>
          </Reveal>
        </div>
      </section>
    </>
  );
}

function Field({
  label,
  type = 'text',
  placeholder,
}: {
  label: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-paper-dim mb-2 block font-mono text-[0.7rem] tracking-widest uppercase">
        {label}
      </label>
      <input
        type={type}
        disabled
        placeholder={placeholder}
        className="border-ink-line bg-ink text-paper placeholder:text-paper-dim/70 w-full cursor-not-allowed rounded-lg border px-4 py-3 outline-none"
      />
    </div>
  );
}
