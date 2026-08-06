/** Mono eyebrow label — “§ 03 · WHO WE ARE”. Defines the systematic, spec-sheet feel. */
export function SectionLabel({ index, children }: { index?: number; children: React.ReactNode }) {
  return (
    <span className="eyebrow inline-flex items-center gap-2">
      {typeof index === 'number' && (
        <span className="text-blue-500">§ {index.toString().padStart(2, '0')}</span>
      )}
      <span className="text-paper-muted">{children}</span>
    </span>
  );
}
