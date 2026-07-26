import type { CSSProperties } from "react";

interface AnimatedHeroCopyProps {
  eyebrow: string;
  heading: string;
  subheading: string;
}

/** The homepage's one expressive text moment, kept semantic and motion-safe. */
export function AnimatedHeroCopy({ eyebrow, heading, subheading }: Readonly<AnimatedHeroCopyProps>) {
  const words = heading.split(" ");

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <p className="hero-eyebrow text-small font-bold uppercase tracking-[0.1em] text-red-text">
          {eyebrow}
        </p>
        <p className="hero-mantra" aria-hidden="true">
          <span>Learn</span>
          <i />
          <span>Play</span>
          <i />
          <span>Shine</span>
        </p>
      </div>

      <h1 className="hero-heading mt-4" aria-label={heading}>
        {words.map((word, index) => {
          const last = index === words.length - 1;
          const style = { "--hero-word-index": index } as CSSProperties;

          return (
            <span
              key={`${word}-${String(index)}`}
              aria-hidden="true"
              style={style}
              className={`hero-word ${last ? "hero-word-shine" : ""}`.trim()}
            >
              {word}
              {index < words.length - 1 ? "\u00a0" : ""}
            </span>
          );
        })}
        <span className="hero-spark" aria-hidden="true">
          ✦
        </span>
      </h1>

      <p className="hero-standfirst mt-5 max-w-xl text-[1.1rem] text-ink/80">{subheading}</p>
    </>
  );
}
