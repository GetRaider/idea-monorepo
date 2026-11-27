/** Year and month of a role boundary. Rendered as "Sep 2024"; never written as a string in markup. */
export type YearMonth = { year: number; month: number };

export type Highlight = {
  text: string;
  /** `false` keeps the highlight out of every page until its numbers are confirmed. */
  verified: boolean;
};

export type ExperienceEntry = {
  id: string;
  company: string;
  role: string;
  /** One line about what the company does. Visible while the role is collapsed. */
  summary: string;
  start: YearMonth;
  /** `null` = present. */
  end: YearMonth | null;
  highlights: Highlight[];
  stack: string[];
};

/** Reverse chronological order. The marquee, Home metrics and /experience all read from here. */
export const experience: ExperienceEntry[] = [
  {
    id: "mento",
    company: "Mento",
    role: "Product Engineer",
    summary:
      "Decentralized FX infrastructure for multi-currency stablecoins.",
    start: { year: 2024, month: 9 },
    end: null,
    highlights: [
      {
        verified: true,
        text: "Increased transaction completions from 8,000 to 10,500/month (31%) by identifying drop-offs in swap, liquidity, & borrow flows, and shipping UX improvements, including real-time gas estimates, outcome previews, and simplified confirmations.",
      },
      {
        verified: true,
        text: "Cut external API costs 60% ($1,200 → $480/month) and improved response times 41% (850ms → 500ms) by identifying redundant calls across 8 on/off-chain data sources (reserve wallets on Ethereum/Bitcoin/Celo, CoinGecko, RPC providers) and shipping a unified cross-chain Analytics API with caching (NestJS + in-memory).",
      },
      {
        verified: true,
        text: "Drove 75% DAU growth and 250% more P2P transactions by co-leading Mento's first airdrop campaign and platform (10M MENTO) with the CPO, launched to MiniPay's 4M+ users across 60+ countries.",
      },
      {
        verified: true,
        text: "Cut delivery cycle time 40% (10 → 6 days) and post-release hotfixes 50% (6 → 3/month) by leading a migration to a monorepo, identifying fragmented tooling and inconsistent testing across repos, and standardizing CI/CD with shared packages (Turbo, Next.js, TailwindCSS, NestJS).",
      },
      {
        verified: true,
        text: "Drove +25% growth in new user interest and +87% satisfaction among existing users by identifying outdated UI/UX flows across app.mento, governance, reserve, website apps, pitching, partnering with CPO and eventually shipping V3 redesign (Next.js, ShadcnUI + pure Radix).",
      },
    ],
    stack: [
      "TypeScript",
      "Node.js",
      "NestJS",
      "Next.js",
      "React",
      "TanStack Query",
      "Tailwind CSS",
      "ShadcnUI",
      "Radix",
      "GraphQL",
      "Redis",
      "GCP",
      "Terraform",
      "Docker",
      "GitHub Actions",
      "Turborepo",
      "Sentry",
      "Vitest",
      "Playwright",
    ],
  },
  {
    id: "corva",
    company: "Corva AI",
    role: "Product Engineer",
    summary:
      "AI real-time platform for optimizing Oil & Gas operations.",
    start: { year: 2022, month: 3 },
    end: { year: 2024, month: 9 },
    highlights: [
      {
        verified: true,
        text: "Reduced data anomalies ~20% (5,000 → 4,000/day) and grew AI workflow adoption 87% (15 → 28 enterprise customers) by identifying recurring data quality issues in drilling streams, designing and shipping AI anomaly detection.",
      },
      {
        verified: true,
        text: "Surfaced 553 data inconsistencies such as incorrect mappings/units across 10 customer businesses, supporting 3 new leads, by designing and shipping an AI-powered latency analyzer targeting latency-driven drop-offs in stream processing (OpenAI/Anthropic APIs).",
      },
      {
        verified: true,
        text: "Improved average issue investigation time ~50% (2–3h → 1.2h) by identifying blind spots in rig and well issue diagnosis post-setup, and building & shipping an internal observability tool for the ops team.",
      },
      {
        verified: true,
        text: "Reduced production incidents ~55–65% (~8–10 → ~3–4/month) by identifying inconsistent release quality across 15 teams, establishing pre-release gates including automated regression suites and smoke tests.",
      },
      {
        verified: true,
        text: "Cut delivery time ~20% (5 → 4 weeks per cycle) and reduced feature rework by identifying misalignment between engineering and design, and establishing RFC, acceptance criteria, and delivery scoping standards adopted across the engineering & PM departments.",
      },
    ],
    stack: [
      "TypeScript",
      "Node.js",
      "NestJS",
      "Express",
      "Fastify",
      "React",
      "Vite",
      "TanStack Query",
      "Redux",
      "Material UI",
      "PostgreSQL",
      "MongoDB",
      "Redis",
      "Kafka",
      "OpenAI and Anthropic APIs",
      "AWS",
      "Docker",
      "GitHub Actions",
      "Grafana",
      "Jest",
      "Playwright",
    ],
  },
  {
    id: "spherity",
    company: "Spherity",
    role: "Full-Stack Engineer",
    summary: "Decentralized identity solutions for enterprises.",
    start: { year: 2020, month: 4 },
    end: { year: 2022, month: 3 },
    highlights: [
      {
        verified: true,
        text: "Reduced average API response time from 3s to 1s (67%) and infra cost $1,100 → $950/month (~14%) by database query optimization.",
      },
      {
        verified: true,
        text: "Reduced initial page load time from ~3.5s to ~2.0s (~43%) by optimizing React re-renders and implementing lazy loading.",
      },
      {
        verified: true,
        text: "Reduced debugging time from ~5h to ~2h (~60%) average resolution time by introducing structured Pino logging, centralized error tracking, and monitoring dashboards in Sentry.",
      },
    ],
    stack: [
      "TypeScript",
      "JavaScript",
      "Node.js",
      "NestJS",
      "Express",
      "React",
      "PostgreSQL",
      "MongoDB",
      "GraphQL",
      "Redis",
      "TypeORM",
      "Auth0",
      "DID/VC",
      "Webpack",
      "TanStack Query",
      "Styled-Components",
      "AWS",
      "Terraform",
      "Docker",
      "GitLab CI",
      "Grafana",
      "Sentry",
      "Pino",
      "Jest",
      "Postman",
    ],
  },
  {
    id: "evolved-ideas",
    company: "Evolved Ideas",
    role: "Test Engineer",
    summary: "Service company for startups and enterprise solutions.",
    start: { year: 2019, month: 3 },
    end: { year: 2020, month: 4 },
    highlights: [
      {
        verified: true,
        text: "Reduced manual testing effort from ~25 to ~15 QA hours per release (~40%) by building an automated testing framework adopted across 4 teams.",
      },
      {
        verified: true,
        text: "Improved pre-release defect detection coverage from ~70% to ~90% through structured test design and reusable testing templates across 3 projects.",
      },
      {
        verified: true,
        text: "Accelerated release cycles from ~2h to ~1h (~50%) by implementing automated CI testing pipelines.",
      },
    ],
    stack: [
      "TypeScript",
      "JavaScript",
      "C#",
      "Node.js",
      "Angular",
      "WebDriverIO",
      "Jest",
      "Postman",
      "GitLab CI",
      "Docker",
      "AWS",
    ],
  },
];

/** Highlights that may appear on the site. */
export function visibleHighlights(entry: ExperienceEntry): Highlight[] {
  return entry.highlights.filter((highlight) => highlight.verified);
}

export function getExperience(id: string): ExperienceEntry {
  const entry = experience.find((item) => item.id === id);
  if (!entry) throw new Error(`Unknown experience id: ${id}`);
  return entry;
}
