import type { Metadata } from 'next';
import { PageHero } from '@/components/sections/page-hero';
import { SectionLabel } from '@/components/ui/section-label';
import { Reveal } from '@/components/ui/reveal';
import { Cta } from '@/components/ui/cta';
import { pillars, leadership } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Who We Are',
  description:
    'The Well Church is a church family in Henderson, NV, growing together in five pillars of faith: Bible Study, Prayer, Worship, Fellowship, and Sharing Our Faith.',
};

export default function WhoWeArePage() {
  return (
    <>
      <PageHero
        index={2}
        eyebrow="Who We Are"
        title="A church family, not a crowd."
        intro="We exist to love people and teach truth — helping ordinary people in Henderson meet Jesus, grow deep, and find their place in a real community."
      />

      {/* Mission */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-12 md:grid-cols-[1fr_1.2fr]">
          <Reveal>
            <SectionLabel>Our Mission</SectionLabel>
          </Reveal>
          <Reveal delay={100}>
            <div>
              <p className="font-display text-3xl leading-snug sm:text-4xl">
                Our main objective is to <span className="text-metal">share in community</span> with
                one another and grow in our five pillars of faith.
              </p>
              <p className="text-paper-muted mt-6 max-w-xl leading-relaxed">
                Those pillars aren’t a program — they’re the rhythms that shape everything we do,
                from Sunday mornings to Well Groups meeting in homes across the valley all week
                long.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Pillars detail */}
      <section>
        <div className="mx-auto max-w-6xl px-6 py-20">
          <Reveal>
            <SectionLabel index={1}>Five Pillars</SectionLabel>
            <h2 className="mt-6 text-4xl sm:text-5xl">What we build our life on.</h2>
          </Reveal>
          <div className="mt-14 space-y-px">
            {pillars.map((pillar, i) => (
              <Reveal key={pillar.name} delay={i * 50}>
                <div className="rule-soft grid grid-cols-[auto_1fr] items-baseline gap-6 py-7 sm:grid-cols-[5rem_1fr_1.2fr] sm:gap-10">
                  <span className="font-mono text-sm text-blue-500">
                    {(i + 1).toString().padStart(2, '0')}
                  </span>
                  <h3 className="text-2xl sm:text-3xl">{pillar.name}</h3>
                  <p className="text-paper-muted col-span-2 leading-relaxed sm:col-span-1">
                    {pillar.blurb}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership (placeholder) */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <Reveal>
          <SectionLabel index={2}>Leadership</SectionLabel>
          <h2 className="mt-6 text-4xl sm:text-5xl">Who’s leading the way.</h2>
        </Reveal>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {leadership.map((person, i) => (
            <Reveal key={person.role} delay={i * 60}>
              <div className="card p-7 text-center">
                <div className="bg-metal glow-blue font-display mx-auto flex h-20 w-20 items-center justify-center rounded-full text-2xl text-[#041520]">
                  {person.initials}
                </div>
                <h3 className="mt-5 text-xl">{person.name}</h3>
                <p className="text-paper-muted mt-1 font-mono text-[0.7rem] tracking-widest uppercase">
                  {person.role}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
        <p className="text-paper-dim mt-8 text-center font-mono text-xs tracking-wide">
          Staff names &amp; photos to be added with the church’s content.
        </p>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden">
        <div className="mesh-glow" />
        <div className="relative mx-auto max-w-3xl px-6 py-24 text-center">
          <Reveal>
            <h2 className="text-4xl sm:text-5xl">
              The best way to know us is to <span className="text-metal">be with us.</span>
            </h2>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Cta href="/connect" variant="metal">
                Plan Your Visit
              </Cta>
              <Cta href="/what-we-do" variant="ghost" arrow="→">
                What We Do
              </Cta>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
