import { IntroHeroScene } from "@/components/IntroHeroScene";
import { IntroPrimaryActions } from "@/components/IntroPrimaryActions";
import { profile } from "@/content/profile";

export default function IntroPage() {
  return (
    <main className="relative mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-6xl flex-col gap-12 px-6 pb-20 pt-10 lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:pt-6">
      <div className="relative z-10 max-w-xl text-center lg:max-w-lg lg:text-left">
        <p className="mb-5 inline-flex rounded-full border border-cyan-400/25 bg-cyan-950/30 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-cyan-200/90">
          Portfolio
        </p>
        <h1 className="m-0 bg-gradient-to-b from-white via-white to-zinc-400 bg-clip-text text-4xl font-semibold leading-[1.05] tracking-tight text-transparent sm:text-5xl lg:text-6xl xl:text-[3.5rem]">
          {profile.name}
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-zinc-400 sm:text-xl">
          Portfolio website — product engineering, full-stack delivery, and
          selected work.
        </p>

        <IntroPrimaryActions />
      </div>

      <div className="relative z-0 w-full flex-1 lg:min-h-[min(40rem,85vh)]">
        <IntroHeroScene />
      </div>
    </main>
  );
}
