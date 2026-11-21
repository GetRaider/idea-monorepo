import Link from "next/link";
import type { ReactNode } from "react";

import { AUDIENCES, FOUNDER_EXAMPLE, HOME_COPY, TOOL_LOGOS, VALUES, WORKFLOW_STEPS } from "@/content/home";

import { ClosingCta } from "./closing-cta";
import { ParticleField } from "./particle-field";
import {
  ArrowIcon,
  ChatIcon,
  CheckIcon,
  CodeIcon,
  DocIcon,
  Eyebrow,
  EyeIcon,
  IconTile,
  LayersIcon,
  LinkIcon,
  ListIcon,
  SectionHeader,
  card,
  textLink,
} from "./ui";
import { JoinWaitlistButton } from "./waitlist";

const example = FOUNDER_EXAMPLE;

const PROBLEM_ICONS = [<ChatIcon key="chat" />, <ListIcon key="list" />, <CodeIcon key="code" />];
const VALUE_ICONS = [<LinkIcon key="link" />, <EyeIcon key="eye" />, <LayersIcon key="layers" />];

export function HomePage() {
  return (
    <div>
      <Hero />
      <ToolStrip />

      <section className="px-5 py-20 sm:py-28" aria-labelledby="problem-title">
        <div className="mx-auto max-w-page">
          <SectionHeader
            id="problem-title"
            eyebrow={HOME_COPY.problem.eyebrow}
            title={HOME_COPY.problem.title}
            lead={HOME_COPY.problem.description}
          />
          <ol className="mt-12 grid gap-4 md:grid-cols-3">
            {example.fragmentedWorkflow.map(({ tool, detail }, index) => (
              <li key={tool} className={`${card} p-5`}>
                <div className="flex items-center gap-3">
                  <IconTile>{PROBLEM_ICONS[index]}</IconTile>
                  <h3 className="font-medium text-white">{tool}</h3>
                </div>
                <p className="mt-5 text-zinc-300">“{detail}”</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="why-todex" className="scroll-mt-20 px-5 py-20 sm:py-28" aria-labelledby="values-title">
        <div className="mx-auto max-w-page">
          <SectionHeader
            id="values-title"
            eyebrow={HOME_COPY.values.eyebrow}
            title={HOME_COPY.values.title}
            lead={HOME_COPY.values.description}
          />
          <ul className="mt-12 grid gap-4 md:grid-cols-3">
            {VALUES.map(({ name, title, description }, index) => (
              <li key={name} className={`${card} flex flex-col p-5`}>
                <div className="flex items-center gap-4">
                  <IconTile>{VALUE_ICONS[index]}</IconTile>
                  <h3 className="font-medium leading-snug text-white">{title}</h3>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-zinc-400">{description}</p>
                <p className="mt-auto pt-4 font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-400">{name}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="workflow" className="scroll-mt-20 px-5 py-20 sm:py-28" aria-labelledby="workflow-title">
        <div className="mx-auto max-w-page">
          <SectionHeader
            id="workflow-title"
            eyebrow={HOME_COPY.workflow.eyebrow}
            title={HOME_COPY.workflow.title}
            lead={HOME_COPY.workflow.description}
          />
          <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            {WORKFLOW_STEPS.map((step, index) => (
              <li
                key={step.module}
                id={"id" in step ? step.id : undefined}
                className={`${card} flex scroll-mt-24 flex-col target:border-white/30 ${index < 3 ? "lg:col-span-2" : "lg:col-span-3"} ${index === 4 ? "sm:col-span-2 lg:col-span-3" : ""}`}
              >
                <div className="p-5 text-center sm:p-6">
                  <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-400">
                    <span aria-hidden="true">{String(index + 1).padStart(2, "0")} · </span>
                    {step.module}
                  </p>
                  <h3 className="mt-3 text-lg font-medium tracking-tight text-white">{step.title}</h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-zinc-400">{step.description}</p>
                </div>
                <div className="mt-auto px-5 pb-5 sm:px-6 sm:pb-6" aria-hidden="true">
                  <WorkflowVisual index={index} />
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="faq" className="scroll-mt-20 px-5 py-20 sm:py-28" aria-labelledby="objections-title">
        <div className="mx-auto max-w-page">
          <SectionHeader id="objections-title" eyebrow={HOME_COPY.objections.eyebrow} title={HOME_COPY.objections.title} />
          <dl className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-2">
            {HOME_COPY.objections.items.map(({ question, answer }) => (
              <div key={question} className={`${card} p-5 sm:p-6`}>
                <dt className="font-medium text-white">{question}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-zinc-400">{answer}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="px-5 py-20 sm:py-28" aria-labelledby="audiences-title">
        <div className="mx-auto max-w-page">
          <SectionHeader id="audiences-title" eyebrow={HOME_COPY.audiences.eyebrow} title={HOME_COPY.audiences.title} />
          <ul className="mt-12 grid gap-4 md:grid-cols-3">
            {AUDIENCES.map(({ id, audience, description }) => (
              <li key={id}>
                <Link
                  href={`/use-cases#${id}`}
                  className={`${card} group flex h-full flex-col p-5 transition-colors hover:border-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:p-6`}
                >
                  <span className="font-medium text-white">{audience}</span>
                  <span className="mt-2 text-sm leading-relaxed text-zinc-400">{description}</span>
                  <span className="mt-auto flex items-center gap-2 pt-6 text-sm text-zinc-200">
                    {HOME_COPY.audiences.linkLabel}
                    <ArrowIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <ClosingCta
        lead={HOME_COPY.closing.lead}
        highlight={HOME_COPY.closing.highlight}
        rest={HOME_COPY.closing.rest}
        description={HOME_COPY.closing.description}
      />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative isolate overflow-hidden px-5 pb-16 pt-32 sm:pb-20 sm:pt-40">
      <ParticleField variant="arc" className="-z-20 [mask-image:linear-gradient(to_bottom,#000_55%,transparent)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_45%_at_50%_32%,rgba(0,0,0,0.55),transparent_70%)]" />
      <div className="mx-auto max-w-page">
        <div className="mx-auto max-w-5xl text-center">
          <h1 className="text-[clamp(2.5rem,6vw,5.5rem)] font-medium leading-[0.98] tracking-[-0.055em] text-silver">
            {HOME_COPY.headlineLead}{" "}
            <span className="block text-silver-dim">{HOME_COPY.headlineRest}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-zinc-300 sm:text-lg">{HOME_COPY.description}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            <JoinWaitlistButton />
            <a href="#workflow" className={textLink}>
              {HOME_COPY.heroSecondary}
            </a>
          </div>
        </div>

        <figure className={`${card} mx-auto mt-14 max-w-3xl bg-zinc-950/80 shadow-[0_-12px_80px_rgba(255,255,255,0.08)] backdrop-blur-sm sm:mt-20`}>
          <figcaption className="flex items-center gap-3 border-b border-white/[0.08] px-5 py-3 text-sm text-zinc-400 sm:px-6">
            <span className="flex gap-1.5" aria-hidden="true">
              <span className="size-2.5 rounded-full bg-white/15" />
              <span className="size-2.5 rounded-full bg-white/15" />
              <span className="size-2.5 rounded-full bg-white/15" />
            </span>
            <span>
              Planning <span aria-hidden="true">/</span> {example.space}
            </span>
          </figcaption>
          <div className="p-5 sm:p-8">
            <p className="text-2xl font-medium tracking-tight text-white sm:text-3xl">{example.task}</p>
            <div className="mt-6 grid gap-6 sm:grid-cols-[1.4fr_1fr]">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-400">Acceptance criteria</p>
                <ul className="mt-3 list-disc space-y-2 pl-4 text-sm text-zinc-300">
                  {example.criteria.map((criterion) => (
                    <li key={criterion}>{criterion}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-400">References</p>
                <ul className="mt-3 space-y-2">
                  {example.references.map(({ href, label, origin }) => (
                    <li key={label} className="text-sm">
                      <a href={href} className={textLink}>
                        {label}
                      </a>
                      <span className="ml-2 text-zinc-400">{origin}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-white/[0.08] bg-white/[0.025] px-5 py-4 sm:px-8">
            <p className="text-sm font-medium text-zinc-200">
              Handed off to {example.handoff.agent} <span className="font-normal text-zinc-400">via Todex MCP</span>
            </p>
            <ul className="mt-3 space-y-2 text-sm text-zinc-400">
              {example.handoff.steps.map((step) => (
                <li key={step} className="flex gap-2">
                  <CheckIcon className="mt-0.5 size-4 shrink-0 text-zinc-300" />
                  {step}
                </li>
              ))}
            </ul>
          </div>
        </figure>
      </div>
    </section>
  );
}

function ToolStrip() {
  return (
    <section className="px-5 pb-8 pt-16 sm:pt-24" aria-labelledby="proof-title">
      <div className="mx-auto flex max-w-page flex-col items-center gap-6 text-center">
        <Eyebrow>{HOME_COPY.proof.eyebrow}</Eyebrow>
        <h2 id="proof-title" className="text-xl font-medium tracking-tight text-silver sm:text-2xl">
          {HOME_COPY.proof.title}
        </h2>
        <ul className="mt-2 flex flex-wrap items-center justify-center gap-x-12 gap-y-6 sm:gap-x-16">
          {TOOL_LOGOS.map((tool) => (
            <li key={tool.name} className="flex h-8 items-center">
              {"src" in tool ? (
                // eslint-disable-next-line @next/next/no-img-element -- official SVG used exactly as provided
                <img src={tool.src} alt={tool.name} width={tool.width} height={tool.height} className="opacity-90" />
              ) : (
                <span className="text-xl font-semibold tracking-tight text-zinc-100 opacity-90">{tool.name}</span>
              )}
            </li>
          ))}
        </ul>
        <p className="mt-2 max-w-lg text-xs leading-relaxed text-zinc-400">{HOME_COPY.proof.note}</p>
        <p className="max-w-lg text-[11px] leading-relaxed text-zinc-500">{HOME_COPY.proof.trademarks}</p>
      </div>
    </section>
  );
}

/* Small product-style illustrations for each workflow card. Decorative; the card text carries the meaning. */

function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-white/[0.08] bg-black/50 p-3 text-left text-xs ${className}`}>{children}</div>;
}

function Row({ children, active = false }: { children: ReactNode; active?: boolean }) {
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 ${active ? "bg-white/[0.09] text-white" : "text-zinc-400"}`}
    >
      {children}
    </div>
  );
}

function WorkflowVisual({ index }: { index: number }) {
  switch (index) {
    case 0:
      return (
        <Panel className="space-y-2">
          <p className="ml-auto w-fit max-w-[85%] rounded-lg bg-white/[0.07] px-3 py-2 text-zinc-300">
            Who already sells invoicing to freelancers?
          </p>
          <p className="w-fit max-w-[85%] rounded-lg border border-white/[0.08] px-3 py-2 text-zinc-300">
            Saved 6 findings and 4 sources to Todex.
          </p>
          <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400">
            <span className="size-1.5 rounded-full bg-zinc-300" /> via Todex MCP
          </p>
        </Panel>
      );
    case 1:
      return (
        <Panel className="space-y-2.5">
          <p className="flex items-center gap-2 text-zinc-200">
            <DocIcon className="size-4" /> MVP scope
          </p>
          <span className="block h-1.5 w-11/12 rounded-full bg-white/10" />
          <span className="block h-1.5 w-8/12 rounded-full bg-white/10" />
          <p className="rounded-lg bg-white/[0.07] px-3 py-2 text-zinc-200">Decision: invoices only. No time tracking.</p>
        </Panel>
      );
    case 2:
      return (
        <Panel className="space-y-1">
          <Row active>
            <span>Invoice draft screen</span>
            <span className="font-mono text-zinc-300">3h</span>
          </Row>
          <Row>
            <span>PDF export</span>
            <span className="font-mono">2h</span>
          </Row>
          <Row>
            <span>Client list</span>
            <span className="font-mono">1h</span>
          </Row>
        </Panel>
      );
    case 3:
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <Panel>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400">Focus Mode</p>
            <p className="mt-2 font-mono text-3xl tracking-tight text-white">24:13</p>
            <span className="mt-3 block h-1 rounded-full bg-white/10">
              <span className="block h-1 w-3/5 rounded-full bg-zinc-200" />
            </span>
          </Panel>
          <Panel className="space-y-1">
            <Row active>
              <span>Cursor</span>
              <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-300">
                <span className="size-1.5 animate-pulse rounded-full bg-zinc-200 motion-reduce:animate-none" /> reading
              </span>
            </Row>
            <Row>
              <span>Task + 2 criteria</span>
              <CheckIcon className="size-3.5" />
            </Row>
            <Row>
              <span>MVP scope</span>
              <CheckIcon className="size-3.5" />
            </Row>
          </Panel>
        </div>
      );
    default:
      return (
        <Panel className="space-y-1">
          <Row active>
            <span>Invoice drafts shipped</span>
            <CheckIcon className="size-3.5" />
          </Row>
          <Row>
            <span>Decision: time tracking stays out</span>
            <CheckIcon className="size-3.5" />
          </Row>
          <Row>
            <span>Next: ask 3 freelancers to send a real invoice</span>
            <ArrowIcon className="size-3.5 shrink-0" />
          </Row>
        </Panel>
      );
  }
}
