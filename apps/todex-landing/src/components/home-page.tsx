import Image from "next/image";
import type { ReactNode } from "react";

import { HOME_REGIONS } from "@/content/home";

import { WaitlistButton } from "./waitlist-button";

export function HomePage() {
  return (
    <div>
      <section className="relative flex min-h-svh flex-col overflow-hidden">
        <HeroAtmosphere />
        <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-6 pb-28 pt-20 text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.34em] text-zinc-500">
            {HOME_REGIONS.hero.eyebrow}
          </p>
          <h1 className="mt-5 text-[clamp(3.25rem,6.6vw,5.75rem)] font-medium leading-[0.92] tracking-[-0.045em]">
            <span className="block text-white">{HOME_REGIONS.hero.headlineLead}</span>
            <span className="mt-1 block bg-gradient-to-b from-white from-15% via-zinc-300 to-zinc-500 bg-clip-text text-transparent">
              {HOME_REGIONS.hero.headlineRest}
            </span>
          </h1>
          <p className="mt-7 max-w-[34rem] text-[15px] leading-relaxed text-zinc-400 sm:text-base">
            {HOME_REGIONS.hero.support}
          </p>
          <div className="mt-9">
            <WaitlistButton />
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center">
          <div className="relative h-[108px] w-[min(1040px,88vw)] overflow-hidden rounded-t-[1.85rem] bg-[#070707] shadow-[0_-1px_0_rgba(255,255,255,0.95),0_-24px_70px_rgba(255,255,255,0.18)]">
            <div className="absolute inset-x-6 -top-3 h-6 bg-white/70 blur-md" />
            <div className="absolute inset-x-0 top-0 h-px bg-white" />
            <div className="absolute inset-x-3 top-3.5 bottom-0 rounded-t-[1.25rem] bg-black ring-1 ring-inset ring-white/10" />
          </div>
        </div>
      </section>

      <Section title={HOME_REGIONS.problem.title}>
        <p className="max-w-2xl text-zinc-400">{HOME_REGIONS.problem.body}</p>
      </Section>

      <Section title={HOME_REGIONS.solution.title}>
        <p className="max-w-2xl text-zinc-400">{HOME_REGIONS.solution.body}</p>
      </Section>

      <Section title={HOME_REGIONS.stepsTitle}>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HOME_REGIONS.steps.map((step) => (
            <li
              key={step}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
            >
              <p className="text-sm text-zinc-500">{step}</p>
              <p className="mt-3 text-lg text-white">Step</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section title={HOME_REGIONS.highlightsTitle}>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {HOME_REGIONS.highlights.map((highlight) => (
            <li
              key={highlight}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
            >
              <p className="text-base text-white">{highlight}</p>
              <p className="mt-2 text-sm text-zinc-400">Label</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title={HOME_REGIONS.choice.title}>
        <p className="max-w-2xl text-zinc-400">{HOME_REGIONS.choice.body}</p>
      </Section>

      <Section title={HOME_REGIONS.audiencesTitle}>
        <ul className="grid gap-4 sm:grid-cols-2">
          {HOME_REGIONS.audiences.map((audience, index) => (
            <li
              key={`${audience}-${index}`}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
            >
              <p className="text-xl text-white">{audience}</p>
              <p className="mt-2 text-sm text-zinc-400">Label</p>
            </li>
          ))}
        </ul>
      </Section>

      <section className="px-5 py-24">
        <div className="mx-auto flex w-full max-w-page flex-col items-start gap-6 rounded-3xl border border-white/10 bg-white/[0.03] px-8 py-12">
          <h2 className="text-4xl font-medium tracking-tight text-white">
            {HOME_REGIONS.close.title}
          </h2>
          <p className="text-zinc-400">{HOME_REGIONS.close.body}</p>
          <WaitlistButton />
        </div>
      </section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="px-5 py-20">
      <div className="mx-auto w-full max-w-page">
        <h2 className="text-3xl font-medium tracking-tight text-white sm:text-4xl">
          {title}
        </h2>
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}

function HeroAtmosphere() {
  return (
    <Image
      src="/hero.png"
      alt=""
      fill
      priority
      unoptimized
      sizes="100vw"
      className="pointer-events-none object-cover object-center"
    />
  );
}
