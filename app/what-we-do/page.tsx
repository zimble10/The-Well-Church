import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero } from '@/components/sections/page-hero';
import { SectionLabel } from '@/components/ui/section-label';
import { Reveal } from '@/components/ui/reveal';
import { Cta } from '@/components/ui/cta';
import { ministries, serviceTimes } from '@/lib/site';

export const metadata: Metadata = {
  title: 'What We Do',
  description:
    'Well Groups, Well Kids, Youth, Worship, Baptism, and Missions — find your place at The Well Church in Henderson, NV.',
};

export default function WhatWeDoPage() {
  return (
    <>
      <PageHero
        index={3}
        eyebrow="What We Do"
        title="There’s a place here for you."
        intro="Church is more than an hour on Sunday. From small groups in living rooms to kids’ ministry and missions, here’s how you can get connected and grow."
      />

      {/* Well Groups highlight */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <Reveal>
          <div className="card relative overflow-hidden p-10 sm:p-14">
            <div className="mesh-glow" />
            <div className="relative max-w-2xl">
              <SectionLabel>Where Church Gets Personal</SectionLabel>
              <h2 className="mt-6 text-4xl sm:text-5xl">
                <span className="text-metal">Well Groups</span> meet all week, all over the valley.
              </h2>
              <p className="text-paper-muted mt-6 leading-relaxed">
                Life change happens in circles, not rows. Well Groups are where you’re known by
                name, prayed for, and challenged to grow — Sunday through Saturday, in homes across
                Henderson.
              </p>
              <div className="mt-8">
                <Cta href="/connect" variant="metal">
                  Find a Group
                </Cta>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* All ministries */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <Reveal>
          <SectionLabel index={1}>Ministries</SectionLabel>
          <h2 className="mt-6 text-4xl sm:text-5xl">Every age, every season.</h2>
        </Reveal>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ministries.map((m, i) => (
            <Reveal key={m.name} delay={i * 60}>
              <Link
                href={m.href}
                className="card group hover:glow-blue flex h-full flex-col p-8 transition hover:border-blue-700/60"
              >
                <span className="font-mono text-sm text-blue-500">
                  {(i + 1).toString().padStart(2, '0')}
                </span>
                <h3 className="mt-4 text-2xl">{m.name}</h3>
                <p className="text-paper-muted mt-3 flex-1 text-sm leading-relaxed">{m.blurb}</p>
                <span className="mt-6 font-mono text-[0.7rem] tracking-widest text-blue-300 uppercase">
                  Learn more →
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Kids reassurance band */}
      <section>
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <Reveal>
              <div>
                <SectionLabel index={2}>Well Kids</SectionLabel>
                <h2 className="mt-6 text-4xl sm:text-5xl">
                  Your kids will <span className="text-metal">love it here.</span>
                </h2>
                <p className="text-paper-muted mt-6 max-w-md leading-relaxed">
                  Safe, secure check-in and fun, age-appropriate environments where kids discover
                  the Bible — available at all three Sunday services (
                  {serviceTimes.inPerson.join(', ')}
                  ).
                </p>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <div className="card bg-ink-line grid grid-cols-2 gap-px overflow-hidden">
                {['Secure Check-In', 'Trained Team', 'Bible-Based', 'All 3 Services'].map((f) => (
                  <div key={f} className="bg-ink p-8">
                    <span className="bg-metal mb-3 block h-1.5 w-8 rounded-full" />
                    <p className="font-display text-xl">{f}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-24 text-center">
        <Reveal>
          <h2 className="text-4xl sm:text-5xl">Not sure where to start?</h2>
          <p className="text-paper-muted mx-auto mt-6 max-w-lg leading-relaxed">
            Come to a service, say hi at the Welcome Center, and we’ll help you take your next step.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Cta href="/connect" variant="metal">
              Plan Your Visit
            </Cta>
          </div>
        </Reveal>
      </section>
    </>
  );
}
