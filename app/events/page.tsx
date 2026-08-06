import type { Metadata } from 'next';
import { PageHero } from '@/components/sections/page-hero';
import { Reveal } from '@/components/ui/reveal';
import { Cta } from '@/components/ui/cta';
import { ComingSoonBadge } from '@/components/ui/coming-soon';
import { events } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Events',
  description:
    'Gatherings, groups, baptisms, and nights of worship at The Well Church in Henderson, NV. See what’s coming up.',
};

export default function EventsPage() {
  return (
    <>
      <PageHero
        index={5}
        eyebrow="Events"
        title="What’s happening at The Well."
        intro="From weekly gatherings to seasonal moments, there’s always a next step and a place to belong. Here’s what’s on the calendar."
      />

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-6 md:grid-cols-2">
          {events.map((e, i) => (
            <Reveal key={e.title} delay={i * 70}>
              <article className="card group flex h-full flex-col p-8 sm:p-10">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[0.7rem] tracking-widest text-blue-300 uppercase">
                    {e.tag}
                  </span>
                  <span className="text-paper-dim font-mono text-[0.7rem] tracking-widest uppercase">
                    {e.date}
                  </span>
                </div>
                <h2 className="mt-5 text-3xl sm:text-4xl">{e.title}</h2>
                <p className="text-paper-muted mt-4 flex-1 leading-relaxed">{e.blurb}</p>
                <div className="rule-soft mt-8 flex items-center justify-between pt-6">
                  <span className="text-paper-dim font-mono text-xs tracking-wide">
                    {e.time} · {e.location}
                  </span>
                  <ComingSoonBadge />
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="card mt-10 flex flex-col items-center gap-6 p-12 text-center">
            <p className="eyebrow">Live Calendar</p>
            <h2 className="max-w-2xl text-3xl sm:text-4xl">
              A full, always-current calendar with{' '}
              <span className="text-metal">one-tap registration</span> is on the way.
            </h2>
            <p className="text-paper-muted max-w-lg leading-relaxed">
              At launch, events sync automatically from the church’s system — no more outdated
              flyers or double entry.
            </p>
            <Cta href="/connect" variant="metal">
              Plan Your Visit
            </Cta>
          </div>
        </Reveal>
      </section>
    </>
  );
}
