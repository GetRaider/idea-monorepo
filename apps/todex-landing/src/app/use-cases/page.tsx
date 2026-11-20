import type { Metadata } from "next";
import Link from "next/link";

import { LandingFrame } from "@/components/landing-frame";
import { OpenTodexLink } from "@/components/open-todex-link";

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
      "Capture a customer insight",
      "Draft requirements",
      "Create estimated tasks",
      "Execute with Cursor using relevant Todex context",
      "Review results",
    ],
  },
  {
    id: "small-teams",
    audience: "Small product teams",
    title: "Keep the plan and the work in sync.",
    description:
      "Make goals, task definitions, decisions, and deliverables visible in one connected workspace. Let team members execute work while compatible agents retrieve the relevant context.",
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
    link: { href: "/#execution-title", label: "See how Todex MCP fits" },
  },
];

export default function UseCasesPage() {
  return (
    <LandingFrame>
      <div className="px-5 pb-16 pt-32 sm:pb-24 sm:pt-40">
        <div className="mx-auto max-w-page">
          <h1 className="max-w-4xl text-[clamp(2.75rem,6.4vw,5.75rem)] font-medium leading-[0.99] tracking-[-0.055em] text-white">
            Built for people with work to get done.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-zinc-400 sm:text-lg">
            From your first product idea to your next launch, Todex connects
            priorities, knowledge, and execution.
          </p>
          <nav aria-label="Jump to a use case" className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
            {useCases.map(({ id, audience }) => (
              <a key={id} href={`#${id}`} className="text-sm text-zinc-200 underline decoration-white/40 underline-offset-4 hover:decoration-white">
                {audience}
              </a>
            ))}
          </nav>
        </div>

        <div className="mx-auto mt-12 max-w-page sm:mt-16">
          {useCases.map(({ id, audience, title, description, steps, link }) => (
            <section
              key={id}
              id={id}
              aria-labelledby={`${id}-title`}
              className="grid scroll-mt-24 gap-7 border-t border-white/15 py-10 md:grid-cols-2 md:gap-12 sm:py-14"
            >
              <div>
                <p className="text-sm text-zinc-400">{audience}</p>
                <h2 id={`${id}-title`} className="mt-3 text-3xl font-medium tracking-tight text-white sm:text-4xl">
                  {title}
                </h2>
                <p className="mt-4 max-w-xl leading-relaxed text-zinc-400">{description}</p>
                {link && (
                  <Link href={link.href} className="mt-4 inline-block text-sm text-zinc-200 underline decoration-white/40 underline-offset-4 hover:decoration-white">
                    {link.label}
                  </Link>
                )}
              </div>
              <div className="rounded-2xl border border-white/15 bg-zinc-950 p-6">
                <h3 className="text-sm font-medium text-zinc-400">Example workflow</h3>
                <ol className="mt-4 list-decimal space-y-3 pl-5 text-zinc-200 marker:text-zinc-400">
                  {steps.map((step) => <li key={step} className="pl-1">{step}</li>)}
                </ol>
              </div>
            </section>
          ))}
        </div>

        <section aria-labelledby="use-cases-close" className="mx-auto mt-6 flex max-w-page flex-col items-start gap-6 rounded-2xl border border-white/15 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6 sm:p-10">
          <h2 id="use-cases-close" className="text-3xl font-medium tracking-tight text-white sm:text-4xl">
            Whatever you’re building, keep moving.
          </h2>
          <OpenTodexLink />
        </section>
      </div>
    </LandingFrame>
  );
}
