import Link from 'next/link';
import Image from 'next/image';
import { Cta } from '@/components/ui/cta';
import { Marquee } from '@/components/ui/marquee';
import { Reveal } from '@/components/ui/reveal';
import { SectionLabel } from '@/components/ui/section-label';
import { ComingSoonBadge } from '@/components/ui/coming-soon';
import { church, serviceTimes, pillars, ministries, events } from '@/lib/site';

export default function HomePage() {
  return (
    <>
      {/* ============================ HERO ============================ */}
      <section className="relative flex min-h-[92vh] items-center overflow-hidden">
        <div className="mesh-glow" />
        {/* Thematic well — faint background element, masked so it never crowds the text */}
        <Image
          src="/well.png"
          alt=""
          aria-hidden
          width={695}
          height={719}
          priority
          className="pointer-events-none absolute top-1/2 right-[2%] hidden h-auto w-[min(50vw,620px)] max-w-none -translate-y-1/2 [mask-image:linear-gradient(to_right,transparent,#000_42%,#000)] opacity-[0.13] sm:block"
        />
        <div className="relative mx-auto w-full max-w-6xl px-6 py-24">
          <Reveal>
            <p className="eyebrow">
              <span className="text-blue-500">§</span> The Well Church · {church.city}
            </p>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-8 text-[2.65rem] leading-[1.08] sm:text-6xl md:text-7xl lg:text-[6.25rem]">
              <span className="text-paper block pb-[0.06em]">Loving People.</span>
              <span className="text-metal block pb-[0.06em]">Teaching Truth.</span>
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="text-paper-muted mt-8 max-w-xl text-lg leading-relaxed sm:text-xl">
              A church family in Henderson, Nevada — gathering to worship, grow, and share the hope
              we’ve found. Wherever you’re coming from, there’s room for you here.
            </p>
          </Reveal>
          <Reveal delay={240}>
            <div className="mt-11 flex flex-wrap items-center gap-4">
              <Cta href="/connect" variant="metal">
                Plan Your Visit
              </Cta>
              <Cta href="/give" variant="ghost" arrow="→">
                Watch Online
              </Cta>
            </div>
          </Reveal>
          <Reveal delay={320}>
            <div className="text-paper-dim mt-16 flex items-center gap-3 font-mono text-xs tracking-widest uppercase">
              <span className="bg-metal h-8 w-px" />
              Sundays · {serviceTimes.inPerson.join(' / ')}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================ MARQUEE ============================ */}
      <Marquee items={pillars.map((p) => p.name)} />

      {/* ============================ SERVICE TIMES ============================ */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid gap-12 md:grid-cols-[1fr_1.1fr] md:items-center">
          <Reveal>
            <div>
              <SectionLabel index={1}>Gather With Us</SectionLabel>
              <h2 className="mt-6 text-4xl sm:text-5xl">
                Three services.
                <br />
                <span className="text-paper-muted">One welcome.</span>
              </h2>
              <p className="text-paper-muted mt-6 max-w-md leading-relaxed">
                Every Sunday service is the same full experience — come to whichever fits your
                morning. {serviceTimes.note}.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Cta href="/connect" variant="metal">
                  Plan Your Visit
                </Cta>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(church.mapQuery)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost"
                >
                  Get Directions <span aria-hidden>→</span>
                </a>
              </div>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="card p-8 sm:p-10">
              <p className="eyebrow">Sunday Schedule</p>
              <ul className="divide-ink-line mt-6 divide-y">
                {serviceTimes.inPerson.map((time, i) => (
                  <li key={time} className="flex items-baseline justify-between py-4">
                    <span className="font-display text-metal text-4xl sm:text-5xl">{time}</span>
                    <span className="text-paper-muted font-mono text-xs tracking-widest uppercase">
                      In-Person · Service {i + 1}
                    </span>
                  </li>
                ))}
                <li className="flex items-baseline justify-between py-4">
                  <span className="font-display text-paper text-3xl sm:text-4xl">
                    {serviceTimes.online}
                  </span>
                  <span className="font-mono text-xs tracking-widest text-blue-300 uppercase">
                    Online Livestream
                  </span>
                </li>
              </ul>
              <p className="text-paper-dim mt-6 flex items-center gap-2 text-sm">
                <span className="bg-metal h-1.5 w-1.5 rounded-full" />
                {church.address.street}, {church.address.cityStateZip}
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================ 5 PILLARS ============================ */}
      <section className="border-ink-line/70 bg-ink-soft/40 border-y">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <Reveal>
            <SectionLabel index={2}>Who We Are</SectionLabel>
            <h2 className="mt-6 max-w-3xl text-4xl sm:text-5xl">
              We grow together in <span className="text-metal">five pillars of faith.</span>
            </h2>
          </Reveal>
          <div className="border-ink-line bg-ink-line mt-14 grid gap-px overflow-hidden rounded-xl border sm:grid-cols-2 lg:grid-cols-3">
            {pillars.map((pillar, i) => (
              <Reveal key={pillar.name} delay={i * 70} className="bg-ink p-8">
                <span className="font-mono text-sm text-blue-500">
                  {(i + 1).toString().padStart(2, '0')}
                </span>
                <h3 className="mt-4 text-2xl">{pillar.name}</h3>
                <p className="text-paper-muted mt-3 text-sm leading-relaxed">{pillar.blurb}</p>
              </Reveal>
            ))}
            <Reveal delay={pillars.length * 70} className="bg-ink flex flex-col justify-center p-8">
              <Cta href="/who-we-are" variant="ghost" arrow="→">
                Our Story
              </Cta>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============================ MINISTRIES ============================ */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <SectionLabel index={3}>What We Do</SectionLabel>
              <h2 className="mt-6 text-4xl sm:text-5xl">Find your place.</h2>
            </div>
            <Cta href="/what-we-do" variant="ghost" arrow="→">
              All Ministries
            </Cta>
          </div>
        </Reveal>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ministries.map((m, i) => (
            <Reveal key={m.name} delay={i * 60}>
              <Link
                href={m.href}
                className="card group hover:glow-blue block h-full p-7 transition hover:border-blue-700/60"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl">{m.name}</h3>
                  <span className="text-blue-500 transition group-hover:translate-x-1" aria-hidden>
                    →
                  </span>
                </div>
                <p className="text-paper-muted mt-3 text-sm leading-relaxed">{m.blurb}</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============================ LATEST MESSAGE ============================ */}
      <section className="border-ink-line/70 bg-ink-soft/40 border-y">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="grid gap-12 md:grid-cols-[1.1fr_1fr] md:items-center">
            <Reveal>
              <div className="card relative aspect-video overflow-hidden">
                <div className="mesh-glow" />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <span className="bg-metal glow-blue flex h-16 w-16 items-center justify-center rounded-full text-2xl text-[#041520]">
                    ▶
                  </span>
                  <ComingSoonBadge />
                </div>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <div>
                <SectionLabel index={4}>Messages</SectionLabel>
                <h2 className="mt-6 text-4xl sm:text-5xl">
                  Miss Sunday?
                  <br />
                  <span className="text-metal">Catch every message.</span>
                </h2>
                <p className="text-paper-muted mt-6 max-w-md leading-relaxed">
                  A full sermon library — watch or listen anytime, on the web or through The Well
                  app on iOS, Android, Amazon Fire, and Roku.
                </p>
                <div className="mt-8">
                  <Cta href="/give" variant="ghost" arrow="→">
                    Watch Online
                  </Cta>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============================ EVENTS STRIP ============================ */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <SectionLabel index={5}>What’s Happening</SectionLabel>
              <h2 className="mt-6 text-4xl sm:text-5xl">Upcoming.</h2>
            </div>
            <Cta href="/events" variant="ghost" arrow="→">
              All Events
            </Cta>
          </div>
        </Reveal>
        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {events.slice(0, 2).map((e, i) => (
            <Reveal key={e.title} delay={i * 80}>
              <div className="card flex h-full flex-col p-8">
                <span className="font-mono text-[0.7rem] tracking-widest text-blue-300 uppercase">
                  {e.tag} · {e.date}
                </span>
                <h3 className="mt-4 text-3xl">{e.title}</h3>
                <p className="text-paper-muted mt-3 flex-1 leading-relaxed">{e.blurb}</p>
                <p className="text-paper-dim mt-6 font-mono text-xs tracking-wide">
                  {e.time} · {e.location}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============================ GIVE CTA BAND ============================ */}
      <section className="border-ink-line relative overflow-hidden border-t">
        <div className="mesh-glow" />
        <div className="relative mx-auto max-w-4xl px-6 py-28 text-center">
          <Reveal>
            <SectionLabel index={6}>Generosity</SectionLabel>
            <h2 className="mt-6 text-4xl sm:text-6xl">
              Be part of <span className="text-metal">what God is doing</span> in Henderson.
            </h2>
            <p className="text-paper-muted mx-auto mt-7 max-w-xl text-lg leading-relaxed">
              Every gift fuels the mission — loving our city, discipling the next generation, and
              taking the Gospel further than we could alone.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Cta href="/give" variant="metal">
                Give Now
              </Cta>
              <Cta href="/connect" variant="ghost" arrow="→">
                Plan Your Visit
              </Cta>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
