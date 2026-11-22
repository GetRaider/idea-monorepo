import { ParticleField } from "./particle-field";
import { JoinWaitlistButton } from "./waitlist";

/**
 * Closing band: a field of dust dunes, then a large monospace statement where the quiet words
 * are gray and the highlight is silver, with the waitlist button on the right.
 */
export function ClosingCta({
  lead,
  highlight,
  rest,
  description,
}: {
  lead: string;
  highlight: string;
  rest: string;
  description?: string;
}) {
  return (
    <section className="relative isolate overflow-hidden px-5 pb-20 sm:pb-28" aria-labelledby="closing-title">
      <div className="relative -mx-5 h-[320px] sm:h-[480px]" aria-hidden="true">
        <ParticleField
          variant="dunes"
          className="[mask-image:linear-gradient(to_bottom,transparent,#000_18%,#000_78%,transparent)]"
        />
      </div>
      <div className="relative mx-auto mt-2 grid max-w-page gap-8 lg:grid-cols-[1fr_auto] lg:items-start lg:gap-16">
        <div>
          <h2
            id="closing-title"
            className="max-w-3xl font-mono text-[clamp(2rem,4.6vw,3.75rem)] font-normal leading-[1.08] tracking-[-0.04em]"
          >
            <span className="text-zinc-500">{lead} </span>
            <span className="text-silver">{highlight}</span>
            <span className="text-zinc-500"> {rest}</span>
          </h2>
          {description ? <p className="mt-6 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">{description}</p> : null}
        </div>
        <JoinWaitlistButton className="justify-self-start lg:mt-3" />
      </div>
    </section>
  );
}
