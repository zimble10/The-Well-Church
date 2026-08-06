/** Infinite horizontal ticker of phrases, separated by a metallic diamond. */
export function Marquee({ items }: { items: string[] }) {
  const row = [...items, ...items];
  return (
    <div className="border-ink-line relative flex overflow-hidden border-y py-5 select-none">
      <div className="animate-marquee flex shrink-0 items-center gap-8 pr-8 whitespace-nowrap">
        {row.map((item, i) => (
          <span key={i} className="flex items-center gap-8">
            <span className="font-display text-paper/80 text-2xl italic">{item}</span>
            <span className="text-metal text-xl" aria-hidden>
              ✦
            </span>
          </span>
        ))}
      </div>
      {/* edge fades */}
      <div className="from-ink pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r to-transparent" />
      <div className="from-ink pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l to-transparent" />
    </div>
  );
}
