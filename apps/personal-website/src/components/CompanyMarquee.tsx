import { experience } from "@/data/experience";

import { monoLabel } from "./ui";

/**
 * Company names from experience.ts, text only. The first list is the real one for screen readers;
 * the five copies that fill the loop are aria-hidden (first half = real + 2 copies, second half = 3 copies). Hover or keyboard focus inside pauses it, and
 * reduced motion turns it into a static wrapped list.
 */
export function CompanyMarquee() {
  const companies = experience.map((entry) => entry.company);
  const item = "shrink-0 px-8 text-xl font-medium tracking-tight text-cream/80 sm:px-12 sm:text-2xl";

  return (
    <section aria-labelledby="worked-at" className="px-5 py-14 sm:py-20">
      <div className="mx-auto flex max-w-page flex-col items-center gap-6">
        <h2 id="worked-at" className={monoLabel}>
          Worked at
        </h2>
        <div
          tabIndex={0}
          className="group relative w-full overflow-hidden rounded-lg [mask-image:linear-gradient(to_right,transparent,#000_12%,#000_88%,transparent)] motion-reduce:[mask-image:none]"
        >
          {/* Two equal halves (3 runs each) so translateX(-50%) loops seamlessly on wide screens. */}
          <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused] motion-reduce:w-full motion-reduce:animate-none">
            <ul className="flex motion-reduce:w-full motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-y-3">
              {companies.map((company) => (
                <li key={company} className={item}>
                  {company}
                </li>
              ))}
            </ul>
            <ul aria-hidden="true" className="flex motion-reduce:hidden">
              {[...companies, ...companies, ...companies, ...companies, ...companies].map((company, index) => (
                <li key={`${company}-${index}`} className={item}>
                  {company}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
