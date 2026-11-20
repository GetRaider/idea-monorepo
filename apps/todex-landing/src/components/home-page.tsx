import Image from "next/image";

import { HOME_COPY, ONBOARDING_EXAMPLE } from "@/content/home";

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
              {HOME_COPY.headlineLead}{" "}
              <span className="block text-zinc-300">{HOME_COPY.headlineRest}</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-zinc-300 sm:text-lg">
              {HOME_COPY.description}
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
            {HOME_COPY.problem.title}
          </h2>
          <p className="mt-5 max-w-2xl leading-relaxed text-zinc-400">
            {HOME_COPY.problem.description}
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
            Keep the same context from research to results.
          </h2>
          <p className="mt-5 max-w-2xl leading-relaxed text-zinc-400">
            Start with a finding or a task you already have. Link the two so you and your agents can pick up the work with the same context.
          </p>
          <ol className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-white/15 bg-white/15 sm:grid-cols-2 lg:grid-cols-4">
            <li id="research-note" className="scroll-mt-24 bg-zinc-950 p-6 target:bg-zinc-800">
              <h3 className="text-sm text-zinc-400">Knowledge</h3>
              <p className="mt-4 text-xl font-medium text-white">{example.source}</p>
              <p className="mt-3 text-sm leading-relaxed text-zinc-300">
                Save the interview findings, their sources, and the decision to offer a sample project.
              </p>
            </li>
            <li className="bg-zinc-950 p-6">
              <h3 className="text-sm text-zinc-400">Planning</h3>
              <p className="mt-4 text-xl font-medium text-white">{example.task}</p>
              <p className="mt-3 text-sm leading-relaxed text-zinc-300">
                Prioritize the task, define what counts as done, and link the interview notes.
              </p>
            </li>
            <li className="bg-zinc-950 p-6">
              <h3 className="text-sm text-zinc-400">Execution</h3>
              <p className="mt-4 text-xl font-medium text-white">Build the sample project</p>
              <p className="mt-3 text-sm leading-relaxed text-zinc-300">
                Start a focused work session or give a connected agent the task and its requirements through Todex MCP.
              </p>
            </li>
            <li className="bg-zinc-950 p-6">
              <h3 className="text-sm text-zinc-400">Outcomes and feedback</h3>
              <p className="mt-4 text-xl font-medium text-white">{example.result}</p>
              <p className="mt-3 text-sm leading-relaxed text-zinc-300">
                Record the outcome on the task and use it to plan the next check. {example.followUp}
              </p>
            </li>
          </ol>
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-14 sm:py-20" aria-labelledby="execution-title">
        <div className="mx-auto grid max-w-page gap-8 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 id="execution-title" className="text-3xl font-medium tracking-tight text-white sm:text-4xl">
              Work yourself or hand it to an agent.
            </h2>
            <p className="mt-4 max-w-xl leading-relaxed text-zinc-400">
              Research in ChatGPT or Claude and save the useful findings in Todex. Once the work is planned, the task holds the priority, requirements, and decisions for whoever picks it up.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="border-t border-white/15 pt-4">
              <h3 className="font-medium text-white">Run a focused session</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                Keep the task in view with Focus Mode, track time as you work, and update progress when you finish.
              </p>
            </div>
            <div className="border-t border-white/15 pt-4">
              <h3 className="font-medium text-white">Hand the task to Cursor</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                With Todex MCP, a connected agent can read task context and attach its implementation summary and decisions to the task.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 pb-16 sm:pb-24" aria-labelledby="start-title">
        <div className="mx-auto flex max-w-page flex-col items-start gap-6 rounded-2xl border border-white/15 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6 sm:p-10">
          <h2 id="start-title" className="max-w-xl text-3xl font-medium tracking-tight text-white sm:text-4xl">
            Bring your next project into Todex.
          </h2>
          <p className="max-w-xl leading-relaxed text-zinc-400">
            Built for solo founders and small product teams working with AI. Start with one task and the decision behind it.
          </p>
          <OpenTodexLink />
        </div>
      </section>
    </div>
  );
}
