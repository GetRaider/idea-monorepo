import Image from "next/image";

import { ONBOARDING_EXAMPLE } from "@/content/home";

import { OpenTodexLink } from "./open-todex-link";

const example = ONBOARDING_EXAMPLE;

export function HomePage() {
  return (
    <div>
      <section className="relative isolate overflow-hidden px-5 pb-16 pt-32 sm:pb-20 sm:pt-40">
        <Image
          src="/hero.png"
          alt=""
          fill
          priority
          unoptimized
          sizes="100vw"
          className="pointer-events-none -z-20 object-cover object-center"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/30 via-black/40 to-black" />
        <div className="mx-auto max-w-page">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-[clamp(2.75rem,7vw,6rem)] font-medium leading-[0.98] tracking-[-0.055em] text-white">
              Keep the why <span className="block text-zinc-300">with the work.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-zinc-300 sm:text-lg">
              Todex connects your research, tasks, and execution. When you sit down to build, the decisions and evidence behind the task are already there.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
              <OpenTodexLink />
              <a href="#workflow" className="rounded text-sm text-white underline decoration-white/50 underline-offset-4 hover:decoration-white">
                See how it works
              </a>
            </div>
          </div>
          <figure className="mx-auto mt-12 max-w-3xl overflow-hidden rounded-2xl border border-white/20 bg-zinc-950 shadow-[0_-10px_60px_rgba(255,255,255,0.08)] sm:mt-16">
            <figcaption className="border-b border-white/10 px-5 py-3 text-sm text-zinc-400 sm:px-8">
              Planning <span aria-hidden="true">/</span> Onboarding
            </figcaption>
            <div className="p-5 sm:p-8">
              <p className="text-2xl font-medium tracking-tight text-white sm:text-3xl">{example.task}</p>
              <div className="mt-6 grid gap-6 sm:grid-cols-[1.4fr_1fr]">
                <div>
                  <p className="text-sm font-medium text-zinc-300">Acceptance criteria</p>
                  <ul className="mt-3 list-disc space-y-2 pl-4 text-sm text-zinc-400">
                    {example.criteria.map((criterion) => <li key={criterion}>{criterion}</li>)}
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-300">References</p>
                  <a href="#research-note" className="mt-3 inline-block text-sm text-white underline decoration-white/50 underline-offset-4 hover:decoration-white">
                    {example.source}
                  </a>
                </div>
              </div>
            </div>
          </figure>
        </div>
      </section>

      <section className="border-y border-white/10 px-5 py-16 sm:py-24" aria-labelledby="problem-title">
        <div className="mx-auto max-w-page">
          <h2 id="problem-title" className="max-w-3xl text-3xl font-medium tracking-tight text-white sm:text-5xl">
            By the time you’re ready to build, the context is scattered.
          </h2>
          <p className="mt-5 max-w-2xl leading-relaxed text-zinc-400">
            You make sense of customer interviews in ChatGPT and put the next step on your task board. A week later, you open Cursor and have to reconstruct what you decided, why, and what counts as done.
          </p>
          <ol className="mt-8 grid gap-3 md:grid-cols-3">
            {example.fragmentedWorkflow.map(({ tool, detail }) => (
              <li key={tool} className="rounded-xl border border-dashed border-white/20 p-5">
                <h3 className="text-sm font-medium text-zinc-400">{tool}</h3>
                <p className="mt-3 text-zinc-200">“{detail}”</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="workflow" className="scroll-mt-20 px-5 py-16 sm:py-24" aria-labelledby="workflow-title">
        <div className="mx-auto max-w-page">
          <h2 id="workflow-title" className="max-w-3xl text-3xl font-medium tracking-tight text-white sm:text-5xl">
            Carry the decision all the way into execution.
          </h2>
          <ol className="mt-8 grid overflow-hidden rounded-2xl border border-white/15 bg-zinc-950 md:grid-cols-3">
            <li id="research-note" className="scroll-mt-24 border-b border-white/10 p-6 target:bg-white/10 md:border-b-0 md:border-r">
              <h3 className="text-sm text-zinc-400">Knowledge</h3>
              <p className="mt-4 text-xl font-medium text-white">{example.source}</p>
              <p className="mt-3 text-sm leading-relaxed text-zinc-300">
                Save the interview findings and record the decision to offer a sample project.
              </p>
            </li>
            <li className="border-b border-white/10 p-6 md:border-b-0 md:border-r">
              <h3 className="text-sm text-zinc-400">Planning</h3>
              <p className="mt-4 text-xl font-medium text-white">{example.task}</p>
              <p className="mt-3 text-sm leading-relaxed text-zinc-300">
                Define what counts as done and link the notes so the reasoning is easy to find.
              </p>
            </li>
            <li className="p-6">
              <h3 className="text-sm text-zinc-400">Execution</h3>
              <p className="mt-4 text-xl font-medium text-white">Build the sample project</p>
              <p className="mt-3 text-sm leading-relaxed text-zinc-300">
                Start a Todex work session or pull the task and its context into Cursor through Todex MCP.
              </p>
            </li>
          </ol>
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-14 sm:py-20" aria-labelledby="integrations-title">
        <div className="mx-auto max-w-page">
          <h2 id="integrations-title" className="text-3xl font-medium tracking-tight text-white">
            Keep using the AI tools you already work with.
          </h2>
          <p className="mt-4 max-w-2xl leading-relaxed text-zinc-400">
            Save research from ChatGPT or Claude to Todex. When it’s time to build, Todex MCP gives Cursor access to the task, its acceptance criteria, and the context behind it.
          </p>
        </div>
      </section>

      <section className="px-5 pb-16 sm:pb-24" aria-labelledby="start-title">
        <div className="mx-auto flex max-w-page flex-col items-start gap-6 rounded-2xl border border-white/15 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6 sm:p-10">
          <h2 id="start-title" className="max-w-xl text-3xl font-medium tracking-tight text-white sm:text-4xl">
            Start with the project you’re already working on.
          </h2>
          <OpenTodexLink />
        </div>
      </section>
    </div>
  );
}
