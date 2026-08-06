import { SectionLabel } from '@/components/ui/section-label';
import { Reveal } from '@/components/ui/reveal';

/** Consistent interior-page hero — keeps every page on the same system. */
export function PageHero({
  index,
  eyebrow,
  title,
  intro,
}: {
  index: number;
  eyebrow: string;
  title: string;
  intro?: string;
}) {
  return (
    <section className="relative overflow-hidden">
      <div className="mesh-glow" />
      <div className="relative mx-auto max-w-6xl px-6 pt-20 pb-14 sm:pt-28 sm:pb-20">
        <Reveal>
          <SectionLabel index={index}>{eyebrow}</SectionLabel>
          <h1 className="mt-6 max-w-4xl text-5xl sm:text-6xl md:text-7xl">
            <span className="text-metal">{title}</span>
          </h1>
          {intro && (
            <p className="text-paper-muted mt-7 max-w-2xl text-lg leading-relaxed sm:text-xl">
              {intro}
            </p>
          )}
        </Reveal>
      </div>
      <div className="mx-auto max-w-6xl px-6">
        <div className="metal-hairline" />
      </div>
    </section>
  );
}
