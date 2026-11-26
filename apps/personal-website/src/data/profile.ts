import { getExperience, type ExperienceEntry } from "./experience";

/** A Home metric points at a highlight in experience.ts, so the numbers cannot drift apart. */
export type MetricRef = {
  experienceId: string;
  highlightIndex: number;
  value: string;
  label: string;
};

export const profile = {
  name: "Andrew Polovets",
  title: "Product Engineer (Full-Stack)",
  oneLiner:
    "I turn ambiguous product and business requirements into end-to-end solutions, owning implementation from user experience through to backend systems.",
  status: "Open to opportunities",
  location: "Remote · Anywhere in the world",
  about: {
    summary:
      "Product-minded builder with 7 years of experience shipping data-intensive and real-time platforms at the intersection of product, data, and engineering. Focused on turning ambiguous product and technical problems into scalable solutions, with a track record of improving user workflows, engineering execution, and delivery speed.",
    stack: [
      "TypeScript",
      "JavaScript",
      "Node.js",
      "NestJS",
      "Next.js",
      "React",
      "PostgreSQL",
    ],
    /** Proven by Todex only: shown next to a "See Todex" link, never in Mento or Corva highlights. */
    ai: [
      "Agents and tool calling",
      "LLM integrations (OpenAI, Anthropic)",
      "RAG (pgvector)",
      "MCP",
    ],
    aiProofSlug: "todex",
    domains: [
      "AI systems",
      "Real-time systems",
      "Identity infrastructure",
      "Fintech platforms",
      "Enterprise tooling",
    ],
  },
  metrics: [
    {
      experienceId: "mento",
      highlightIndex: 1,
      value: "60%",
      label: "lower external API costs ($1,200 → $480/month) and 41% faster responses after unifying 8 on/off-chain data sources into one cached Analytics API",
    },
    {
      experienceId: "mento",
      highlightIndex: 3,
      value: "50%",
      label: "fewer post-release hotfixes (6 → 3/month) and a 40% shorter delivery cycle after leading the move to a monorepo with standardized CI/CD",
    },
    {
      experienceId: "corva",
      highlightIndex: 3,
      value: "55–65%",
      label: "fewer production incidents (~8–10 → ~3–4/month) after establishing pre-release gates with automated regression and smoke tests across 15 teams",
    },
  ] satisfies MetricRef[],
  lookingFor: "Product Engineer roles, remote.",
  contact: {
    /** Set NEXT_PUBLIC_PERSONAL_WEBSITE_CONTACT_EMAIL; the email row is hidden while it is empty. */
    email: process.env.NEXT_PUBLIC_PERSONAL_WEBSITE_CONTACT_EMAIL ?? "",
    linkedin: "https://www.linkedin.com/in/andrew-polovets/",
    github: "https://github.com/GetRaider",
  },
} as const;

export type ResolvedMetric = MetricRef & {
  company: string;
  source: ExperienceEntry;
};

/** Resolves each metric against its highlight; an unverified or missing highlight drops the metric. */
export function resolveMetrics(): ResolvedMetric[] {
  return profile.metrics.flatMap((metric) => {
    const source = getExperience(metric.experienceId);
    const highlight = source.highlights[metric.highlightIndex];
    if (!highlight?.verified) return [];
    return [{ ...metric, company: source.company, source }];
  });
}
