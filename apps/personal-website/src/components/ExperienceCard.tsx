import { visibleHighlights, type ExperienceEntry } from "@/data/experience";
import { formatYearMonth, toIsoMonth } from "@/lib/format";

import { TagList, card, monoLabel } from "./ui";

/**
 * A role as a collapsible CV entry, closed by default: company, role, dates and what the
 * company does stay visible; highlights and stack open on demand. Unverified highlights never render.
 */
export function ExperienceCard({ entry }: { entry: ExperienceEntry }) {
  const highlights = visibleHighlights(entry);

  return (
    <details className={`${card} group transition-colors open:border-white/15 hover:border-white/15`}>
      <summary className="flex cursor-pointer list-none items-start gap-4 rounded-2xl p-6 sm:p-8 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
            <h2 className="text-2xl font-medium tracking-tight text-cream">
              {entry.company}
              <span className="text-mist"> · </span>
              <span className="text-ember">{entry.role}</span>
            </h2>
            <p className={`${monoLabel} shrink-0`}>
              <time dateTime={toIsoMonth(entry.start)}>{formatYearMonth(entry.start)}</time>
              {" – "}
              {entry.end ? <time dateTime={toIsoMonth(entry.end)}>{formatYearMonth(entry.end)}</time> : "Present"}
            </p>
          </div>
          <p className="mt-2 text-[15px] leading-relaxed text-mist">{entry.summary}</p>
        </div>
        <span
          aria-hidden="true"
          className="mt-1 inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-white/12 text-mist transition-transform duration-300 group-open:rotate-180 group-hover:text-cream"
        >
          <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="m5 7.5 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </summary>

      <div className="border-t border-white/[0.08] px-6 pb-6 pt-5 sm:px-8 sm:pb-8">
        <ul className="space-y-3">
          {highlights.map((highlight) => (
            <li key={highlight.text} className="flex gap-3 text-[15px] leading-relaxed text-cream/90">
              <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-ember" />
              <span>{highlight.text}</span>
            </li>
          ))}
        </ul>
        <div className="mt-6">
          <p className={`${monoLabel} mb-2.5`}>Stack</p>
          <TagList items={entry.stack} label={`${entry.company} stack`} />
        </div>
      </div>
    </details>
  );
}
