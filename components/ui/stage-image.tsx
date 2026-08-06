import Image from 'next/image';

/**
 * A large, faint image that lives inside a section, scrolls up WITH the page,
 * and fades in/out based on the section's progress through the viewport — peaking
 * when the section is centered. Pure CSS scroll timeline (see .stage-image); no JS.
 *
 * Drop one as the first child of a `relative` section and give the section's
 * content a higher stacking context (e.g. `relative z-10`). This is how the logo
 * and (later) real church photos appear per section.
 */
export function StageImage({ src, alt = '' }: { src: string; alt?: string }) {
  return (
    <div className="stage-image" aria-hidden>
      <div className="stage-image-frame">
        <Image src={src} alt={alt} fill sizes="70vw" className="object-contain" />
      </div>
    </div>
  );
}
