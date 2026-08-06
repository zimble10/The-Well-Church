import { SectionLabel } from '@/components/ui/section-label';
import { Cta } from '@/components/ui/cta';

/** Small inline pill — marks a feature as not-yet-live in the demo. */
export function ComingSoonBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-blue-800/60 bg-blue-900/20 px-2.5 py-0.5 font-mono text-[0.62rem] tracking-widest text-blue-200 uppercase ${className}`}
    >
      <span className="bg-metal h-1.5 w-1.5 rounded-full" />
      Coming Soon
    </span>
  );
}

/** Full-page placeholder for features shown-but-not-built in the demo. */
export function ComingSoonBlock({
  index,
  eyebrow,
  title,
  description,
}: {
  index?: number;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className="relative mx-auto max-w-3xl px-6 py-28 text-center sm:py-36">
      <div className="mesh-glow" />
      <div className="relative">
        <SectionLabel index={index}>{eyebrow}</SectionLabel>
        <h1 className="text-metal mt-6 text-5xl sm:text-6xl">{title}</h1>
        <div className="mx-auto mt-8 mb-8 h-px w-40">
          <div className="metal-hairline h-full w-full" />
        </div>
        <p className="text-paper-muted mx-auto max-w-xl text-lg leading-relaxed">{description}</p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <ComingSoonBadge />
        </div>
        <div className="mt-12">
          <Cta href="/" variant="ghost" arrow="→">
            Back Home
          </Cta>
        </div>
      </div>
    </section>
  );
}
