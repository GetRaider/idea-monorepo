export type ProductTier = "featured" | "secondary" | "compact";

export type ProductLink = { label: string; href: string };

export type ProductMedia = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export type Product = {
  slug: string;
  name: string;
  /** One line: what it is. */
  tagline: string;
  status: string;
  /** "closed" renders the status badge muted. */
  statusTone?: "active" | "closed";
  tier: ProductTier;
  /** One or two sentences. */
  why: string;
  /** Deployed product or repository; only links that exist. Empty = no link block. */
  links: ProductLink[];
  stack: string[];
  /** Small square mark shown on cards. */
  logo?: string;
  /** Screenshots shown on the product page, in order. */
  media?: ProductMedia[];
  /** Slug of the product this one led to. */
  predecessorOf?: string;
  /** Optional "Details" block at the bottom of the product page. */
  details?: { title: string; body: string }[];
};

export const products: Product[] = [
  {
    slug: "todex",
    name: "Todex",
    tagline: "AI-Native Work OS for people and agents",
    status: "Pre-launch, waitlist open",
    tier: "featured",
    why: "Solo founders and small AI-native teams target the context fragmentation: research lives in one tool, decisions in another, tasks in a tracker, code in an editor, and every handoff means re-explaining what to build and why. Todex keeps research, decisions, plans, and results linked, so people and AI agents work from the same context and outcomes flow back into it.",
    links: [{ label: "trytodex.com", href: "https://www.trytodex.com/" }],
    stack: [
      "Next.js",
      "NestJS",
      "PostgreSQL + pgvector",
      "MCP",
      "OpenAI and Anthropic APIs",
    ],
    logo: "/products/todex.png",
    media: [
      {
        src: "/products/todex-planning.webp",
        alt: "Todex Planning view: a Kanban board for the Todex space with To Do, In Progress, Done and Cancelled columns.",
        width: 2000,
        height: 1085,
      },
      {
        src: "/products/todex-execution.webp",
        alt: "Todex Execution view: suggestions, a task queue, and an execution panel with timer, Focus Mode and work summary.",
        width: 2000,
        height: 1093,
      },
    ],
  },
  {
    slug: "take-and-do",
    name: "Take & Do",
    tagline:
      "Predecessor of Todex: unified context for tasks, calendar events, and docs",
    status: "Closed",
    statusTone: "closed",
    tier: "secondary",
    why: "Most people don't fail because they lack an app, they fail because context doesn't travel with their work. Take & Do links tasks, calendar events, and documents in one workspace so context stays with the work.",
    // take-and-do.vercel.app returned 404 on 2026-11-26; add the link back once the deploy is live.
    links: [],
    stack: ["Next.js", "React", "TypeScript", "PostgreSQL", "Drizzle"],
    logo: "/products/take-and-do.svg",
    predecessorOf: "todex",
    details: [
      {
        title: "Problem research",
        body: "Long Reddit and Hacker News threads about Todoist, Things, Notion and Apple Reminders. The recurring complaints were structural: tasks and calendar events don't stay linked as plans change, and notes and tasks duplicate.",
      },
      {
        title: "Non-goals",
        body: "Not a replacement for an enterprise calendar and not a generic wiki.",
      },
      {
        title: "Analytics",
        body: "Mixpanel events separate anonymous guest sessions from waitlist leads, so funnels don't mix the two populations.",
      },
    ],
  },
  {
    slug: "devinity",
    name: "Devinity",
    tagline: "AI engineering intelligence for engineering leaders",
    status: "In development",
    tier: "compact",
    why: "Engineering leaders see activity in GitHub but not the reason behind it. Devinity connects pull requests, diffs, reviews, tasks, and product intent to explain what is happening, where, when, and why.",
    links: [],
    stack: ["Next.js", "NestJS", "GitHub MCP"],
    logo: "/products/devinity.png",
  },
  {
    slug: "evolin",
    name: "Evolin",
    tagline: "Habit establishment app",
    status: "In development",
    tier: "compact",
    why: "Habit trackers record activity instead of building behavior: they lean on streaks and punish missed days. Evolin limits how many habits you start, defines when each one is established, and then takes it out of daily tracking.",
    links: [],
    stack: ["Expo", "React Native", "NestJS", "PostgreSQL"],
  },
  {
    slug: "tempo",
    name: "Tempo",
    tagline: "Desktop focus and time-tracking app",
    logo: "/products/tempo.png",
    media: [
      {
        src: "/products/tempo-focus.webp",
        alt: "Tempo Focus screen: stopwatch and timer modes, an activity picker, a large 00:00 clock, a Start button and quick durations.",
        width: 1960,
        height: 1360,
      },
    ],
    status: "Prototype",
    tier: "compact",
    why: "A problem I have myself: understanding where work time actually goes and improving how it is spent.",
    links: [],
    stack: ["Electron", "React", "TypeScript", "Tailwind", "SQLite"],
  },
  {
    slug: "airove",
    name: "Airove",
    tagline: "One desktop workspace for ChatGPT and Claude",
    media: [
      {
        src: "/products/airove-new-chat.webp",
        alt: "Airove new chat screen: a sidebar of Spaces and folders, and a draft form to pick ChatGPT or Claude and a Space.",
        width: 2000,
        height: 1356,
      },
    ],
    status: "In development",
    tier: "compact",
    why: "Chats with different AI providers live in separate apps and tabs. Airove brings ChatGPT and Claude into one desktop app, with Spaces and folders to organize chats.",
    links: [],
    stack: ["Electron", "React", "TypeScript", "Tailwind", "SQLite"],
  },
];

export function getProduct(slug: string): Product | undefined {
  return products.find((product) => product.slug === slug);
}

export function productsByTier(tier: ProductTier): Product[] {
  return products.filter((product) => product.tier === tier);
}
