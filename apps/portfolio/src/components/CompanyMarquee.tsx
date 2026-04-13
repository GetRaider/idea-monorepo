import { profile } from "@/content/profile";

export function CompanyMarquee() {
  const items = [...profile.employers, ...profile.employers];

  return (
    <section
      className="border-y border-white/[0.06] bg-black/20 py-4"
      aria-label="Places worked"
    >
      <p className="mb-2 text-center text-[0.65rem] font-medium uppercase tracking-[0.32em] text-zinc-500">
        Experience at
      </p>
      <div className="mx-auto max-w-md px-4 md:max-w-sm">
        <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent_0%,black_22%,black_78%,transparent_100%)]">
          <div className="flex w-max animate-marquee-left items-center gap-8 py-1 pr-8 md:gap-10 md:pr-10">
            {items.map((company, index) => (
              <span
                key={`${company}-${index}`}
                className="whitespace-nowrap text-sm font-medium leading-snug text-zinc-400 md:text-base"
              >
                {company}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
