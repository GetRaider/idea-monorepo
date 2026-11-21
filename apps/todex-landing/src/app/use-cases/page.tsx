import type { Metadata } from "next";
import Link from "next/link";

import { LandingFrame } from "@/components/landing-frame";
import { ClosingCta } from "@/components/closing-cta";
import { ParticleField } from "@/components/particle-field";
import { Eyebrow, card, textLink } from "@/components/ui";

export const metadata: Metadata = {
  title: "Use Cases | Todex for Founders, Teams & AI Builders",
  description:
    "Discover connected planning, knowledge, and execution workflows for solo founders, small product teams, and AI-assisted builders.",
};

const useCases = [
  {
    id: "solo-founders",
    audience: "Solo founders",
    title: "Build your company without losing the thread.",
    description:
      "Your product roadmap, customer insights, engineering tasks, and personal priorities compete for attention. Use spaces to organize work, Knowledge to preserve decisions, and Execution to focus on the next meaningful outcome.",
    steps: [
      "Research competitors in ChatGPT",
      "Save the findings to Knowledge through Todex MCP",
      "Define the MVP scope, tasks, and criteria for done",
      "Let Cursor or Claude Code pull a task with its requirements and decisions",
      "Do the rest yourself in Focus Mode, with time tracked",
      "Record results and new decisions in Todex",
    ],
  },
  {
    id: "small-teams",
    audience: "Small AI-native teams",
    title: "Keep the plan and the work in sync.",
    description:
      "Make goals, task definitions, decisions, and deliverables visible in one connected workspace. See what people and agents are working on, why, and what’s done, while compatible agents retrieve the relevant context.",
    steps: [
      "Agree on an objective",
      "Organize tasks and requirements",
      "Assign the work",
      "Execute and review completed deliverables",
    ],
  },
  {
    id: "ai-assisted-builders",
    audience: "AI-assisted builders",
    title: "Keep your agents connected to the source.",
    description:
      "Use Todex to give tools such as Cursor the task, its acceptance criteria, and the decisions behind it. A connected agent can read the context and attach its implementation summary to the task.",
    steps: [
      "Select an implementation task",
      "Retrieve its context via MCP",
      "Implement externally",
      "Review and record the outcome",
    ],
    link: { href: "/#workflow", label: "See how a handoff works" },
  },
];

export default function UseCasesPage() {
  return (
    <LandingFrame>
      <section className="relative isolate overflow-hidden px-5 pb-12 pt-32 sm:pb-16 sm:pt-40">
        <ParticleField variant="arc" className="-z-20 opacity-60 [mask-image:linear-gradient(to_bottom,#000_50%,transparent)]" />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_50%_40%,rgba(0,0,0,0.6),transparent_70%)]" />
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <Eyebrow>Use cases</Eyebrow>
          <h1 className="mt-6 text-[clamp(2.5rem,6vw,5.25rem)] font-medium leading-[0.99] tracking-[-0.055em] text-silver">
            Go from idea to finished work, your way.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-zinc-300 sm:text-lg">
            From your first product idea to your next launch, Todex connects priorities, knowledge, and execution.
          </p>
          <nav aria-label="Jump to a use case" className="mt-8 flex flex-wrap justify-center gap-2">
            {useCases.map(({ id, audience }) => (
              <a
                key={id}
                href={`#${id}`}
                className="rounded-[10px] border border-white/10 bg-white/[0.03] px-4 py-1.5 text-sm text-zinc-200 hover:border-white/25 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {audience}
              </a>
            ))}
          </nav>
        </div>
      </section>

      <div className="mx-auto max-w-page space-y-4 px-5 pb-8">
        {useCases.map(({ id, audience, title, description, steps, link }) => (
          <section
            key={id}
            id={id}
            aria-labelledby={`${id}-title`}
            className={`${card} grid scroll-mt-24 gap-8 p-6 sm:p-10 md:grid-cols-2 md:gap-12`}
          >
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-400">{audience}</p>
              <h2 id={`${id}-title`} className="mt-4 text-3xl font-medium tracking-tight text-silver sm:text-4xl">
                {title}
              </h2>
              <p className="mt-4 max-w-xl leading-relaxed text-zinc-400">{description}</p>
              {link && (
                <Link href={link.href} className={`mt-5 inline-block ${textLink}`}>
                  {link.label}
                </Link>
              )}
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-black/50 p-5">
              <h3 className="font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-400">Example workflow</h3>
              <ol className="mt-4 space-y-1">
                {steps.map((step, index) => (
                  <li
                    key={step}
                    className={`flex gap-3 rounded-lg px-3 py-2.5 text-sm ${index === 0 ? "bg-white/[0.08] text-white" : "text-zinc-300"}`}
                  >
                    <span className="font-mono text-xs leading-5 text-zinc-500">{String(index + 1).padStart(2, "0")}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </section>
        ))}
      </div>

      <ClosingCta lead="Whatever you’re building," highlight="plan the first task" rest="today." />
    </LandingFrame>
  );
}
