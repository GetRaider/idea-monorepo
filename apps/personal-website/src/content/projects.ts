export const PRODUCTION_UNAVAILABLE_TOOLTIP =
  "Unavailable at this development stage";

export type PortfolioProject = {
  slug: string;
  title: string;
  tagline: string;
  summary: string;
  why: string;
  how: string;
  productRequirements: string;
  analytics: string;
  prodUrl: string | null;
  stage: "Early Access" | "In Progress" | "Planning" | "Public Access";
  repoUrl: string;
};

export const projects: PortfolioProject[] = [
  {
    slug: "take-and-do",
    title: "Take & Do",
    tagline: "AI Productivity Manager",
    summary:
      "Take & Do is a modern AI productivity manager: task workspaces with Kanban and list views, calendar events, and documents that build shared context so everyone stays aligned. AI-assisted flows reduce friction-from capturing work to finishing it - while the same surface holds code, delivery, and everyday life so nothing fragments across a dozen tools.",
    why: `Most people don't fail because they lack an app - they fail because context doesn't travel with their work. A task lives in Jira, the spec in Notion, the meeting in Google Calendar - but the reason, decision, and state tying them together are missing.

Modern tools optimize for isolated surfaces (lists, docs, calendars) - not for the relationship between them. As a result, people constantly reconstruct context: why this task exists, what it depends on, and when it actually matters.

That fracture shows up everywhere - from software delivery to everyday life. Work becomes a series of disconnected snapshots instead of a continuous flow. Take & Do exists to close that gap: a system where tasks, time, and knowledge stay linked, and context evolves with the work instead of being rebuilt in your head.`,
    how: `**Stack -** Next.js 15 (App Router) with Turbopack in development, React 19, strict TypeScript, and a hybrid styling model: styled-components for feature UI, Radix Themes / primitives for accessible controls, and Tailwind where utility-first wins (shared dialog chrome from \`@repo/ui\`).

**Data & auth -** Drizzle ORM against PostgreSQL for durable workspace, board, task, and schedule data; Better Auth with email/password plus optional Google, anonymous “guest” sessions where appropriate, and server-enforced access rules so workspaces stay isolated.

**Performance -** Server Components and route handlers used deliberately so the client bundle stays lean; fetch caching and revalidation where reads are hot; no imaginary micro-optimizations before instrumentation says they matter.

**Editors & composition -** Lexical and TipTap cover rich descriptions and inline structure without locking content into opaque blobs-important for tasks that are half-spec, half-checklist.

**Quality -** ESLint + Prettier, Vitest for units, native HTML5 drag-and-drop on the board (no brittle DnD polyfills), focus management in dialogs (shared \`@repo/ui\` primitives), and environment validation for anything that touches secrets.

**Principles -** ship thin vertical slices, keep auth boundaries boring and explicit, prefer boring PostgreSQL over clever client caches, and instrument real user journeys before optimizing micro-fetches.`,
    productRequirements: `**Problem discovery -** Before shaping the roadmap, I read long threads on Reddit (r/productivity, r/getdisciplined, app-specific subs) and Hacker News “Ask” threads where people vent about Todoist, Things, Notion, and Apple Reminders. The recurring complaints were not “missing features”-they were *structural*: tasks and calendar events do not stay linked as plans change; notes and tasks duplicate; recurring life maintenance gets lost under work sprints; and “one inbox” collapses when work uses a board but life still uses a calendar.

**Product implications -**
- First-class *schedules* next to boards so a task can own-or reference-time without exporting mental state to a separate calendar app.
- Workspaces that isolate context (work vs personal vs side project) without forcing separate logins for every experiment.
- Native Kanban with clear column semantics and fast drag operations; no fake “multiplayer” claims-just reliable local UX.
- Rich task bodies for specs and checklists; shallow integration points instead of pretending to replace Google Docs.
- Guest and waitlist flows that let people try the surface before committing identity-without weakening tenancy rules for paid workspaces later.

**Non-goals (for now) -** becoming a full calendar replacement for enterprise, or a generic wiki-those expand scope faster than a small team can support.`,
    analytics: `**Mixpanel (browser) -** The product distinguishes *anonymous guests* (ephemeral trials) from *waitlist-qualified leads* (email captured, intent signal). Events are named and propertied so funnels do not conflate the two populations.

**Core events -**
- \`Guest Session Started\` / \`Guest Board Created\` - volume and depth of try-before-signup behavior.
- \`Task Moved\`, \`Column Changed\`, \`Schedule Block Linked\` - board and schedule adoption, not vanity clicks.
- \`Whitelist Dialog Opened\`, \`Whitelist Submitted\`, \`Whitelist Failed\` - conversion and friction on the waitlist path with \`_replyto\` preserved for sales follow-up.
- \`Auth Login Started\`, \`Auth Login Succeeded\` - separate funnel from guest traffic.

**Improvements -** super-properties for workspace tier (guest vs registered), session replay sampling on error boundaries, and cohort reports that compare “guests who created ≥3 tasks” vs “waitlist only”-so marketing spend optimizes for retained trials, not form fills alone. Server-side logs remain the source of truth for API failures; Mixpanel explains *behavior*, not stack traces.`,
    prodUrl: "https://take-and-do.vercel.app",
    stage: "Early Access",
    repoUrl:
      "https://github.com/GetRaider/idea-monorepo/tree/main/apps/take-and-do",
  },
  {
    slug: "devinity",
    title: "Devinity",
    tagline: "AI Engineering Management",
    summary:
      "Context for what your teams actually ship. Devinity is an AI-forward engineering management workspace: it connects initiatives, code changes, releases, and team narratives so leaders are not rebuilding a picture of reality from fragmented artifacts scattered across chat, tickets, and decks.",
    why: `Running engineering at scale is less about “tracking story points” and more about maintaining a *shared, honest model* of what is being built, by whom, under which constraints, and what actually reached production. In most organizations that model decays: Jira tickets diverge from Git reality, roadmaps are PowerPoint fiction, and new engineers spend weeks building mental maps from fragmented docs.

The pain intensifies when work spans multiple teams and vendors-you need a living context layer that ties epics to repositories, releases to customer commitments, and technical debt to business risk. Without that layer, “alignment” meetings recycle the same questions and leaders optimize for visibility instead of throughput. Devinity targets that gap: an eng-specific context fabric that helps teams grow without losing the thread of what shipped, why it shipped, and what is next.`,
    how: `**Architecture -** NestJS feature modules with clear boundaries (initiatives, repos, releases, people, AI summaries); Drizzle schemas against PostgreSQL for relational integrity; Redis for session-adjacent and rate-sensitive reads; shared DTOs via \`@repo/api\` so web and API agree on shapes.

**AI layer -** Retrieval over approved sources (PR descriptions, RFCs, release notes-not raw secret data) to generate concise “state of initiative” briefs, risk callouts, and onboarding digests. Human review is always the contract: models propose, leads confirm.

**Web -** Next.js shell for authenticated leadership views and public marketing pages; styled similarly to the rest of the monorepo so experimentation is cheap.

**Principles -** event-sourced release markers where possible, immutable links to source artifacts, least-privilege service tokens, and explicit data residency flags for future enterprise pilots.`,
    productRequirements: `**Customer discovery -** I ran a structured customer interview with my former CTO, walking through how they rebuilt quarterly planning after a reorganisation. We mapped where context lived (Notion, Jira, GitHub, slides), where it lied, and how much time exec staff spent “re-briefing” teams after every escalation.

**What we validated -**
- Leaders want a *single narrative spine* per initiative that links business intent → technical scope → shipping evidence-not another dashboard of vanity metrics.
- ICs will ignore tools that require duplicate entry; ingestion must be API- and Git-native with light human curation.
- AI is acceptable only when every claim cites a source artifact and edits are attributable.

**MVP scope -** initiative timelines with release anchors, repo ↔ team ownership graph, AI-generated weekly briefs with citations, and export to existing slide decks so Devinity augments-not replaces-current rituals.

**Explicit non-goals for v0 -** automated performance management, headcount planning, or HRIS replacement.`,
    analytics: `**Product analytics -** Track \`Brief Generated\`, \`Brief Edited\`, \`Source Link Followed\`, and \`Weekly Digest Exported\` to measure whether AI output is trusted (editing without deletion is a positive signal). Funnel from invited leader → connected Git org → first pinned initiative.

**Engineering health -** Deployment frequency and change-failure proxies per team (from CI/CD hooks), correlated-but not equated-with DORA metrics; the goal is *explainability*, not gamification.

**Privacy -** aggregate-only reporting for comparative team views until explicit opt-in; audit logs for who viewed which AI summary (future enterprise requirement).`,
    prodUrl: null,
    stage: "In Progress",
    repoUrl: "https://github.com/GetRaider/idea-monorepo/tree/main/apps",
  },
  {
    slug: "snap-words",
    title: "Snap Words",
    tagline: "English Vocabulary Explorer",
    summary:
      "Snap Words helps you learn new words through flash cards and other study modes, with AI-generated examples and explanations for each term. DeepL powers translations so you can pair meaning across languages while keeping the study loop fast and focused.",
    why: `Vocabulary apps often force one rigid study path or bury you in configuration. Snap Words starts from a simple idea: **flash cards should be flexible** - deck structure, card faces, and review order should adapt to how you learn, not the other way around.

AI fills in what static dictionaries miss: natural examples, short explanations, and context so a word sticks beyond a single translation line. The goal is a calm, repeatable habit - open a deck, snap through cards, and leave with clearer recall than another abandoned word list.`,
    how: `**Client -** A focused mobile-first experience around decks and sessions; flash cards are the primary surface, with room to add spaced repetition and alternate drills without rewriting the core model.

**AI -** Prompted generation of examples and explanations per word, with guardrails so output stays concise and appropriate for study. The pipeline is built so providers can evolve as models and pricing change.

**Translations -** DeepL is used for reliable, high-quality translation between your working languages so you spend time learning, not copy-pasting into separate tools.

**Principles -** flexible card layouts first, minimal friction between 'add word' and 'review', and transparent handling of third-party services (translation and AI) in product copy and settings.`,
    productRequirements: `**Core -**
- Create and edit decks; add words with source language, target language, and optional notes.
- Flash card session with configurable fronts and backs (term, translation, example, explanation).
- AI-generated example sentences and short explanations per word, user-triggered or on save.

**Integrations -**
- DeepL for translation payloads the learner expects in a language app.

**Quality -**
- Graceful offline or failure states when AI or translation APIs are unavailable; never lose in-progress edits.

**Non-goals (for now) -** full classroom product, social feeds, or a generic chat assistant unrelated to vocabulary.`,
    analytics: `**Future instrumentation -** deck creation, session length, cards reviewed per session, and AI generation success versus skip rate - so improvements target study quality, not vanity counts.

**Privacy posture -** minimize retained content from AI calls; prefer aggregated product metrics over raw prompts in analytics backends.`,
    prodUrl: null,
    stage: "Planning",
    repoUrl: "https://github.com/GetRaider/idea-monorepo",
  },
  {
    slug: "personal-website",
    title: "Personal Website",
    tagline: "Personal landing page",
    summary:
      "Next.js micro-site inspired by modern AI SaaS landing pages-gradient field, marquee, and FormSubmit-backed contact.",
    why: "Single place to showcase work and filter inbound CV requests with context.",
    how: "Next.js 15, Tailwind, shared `@repo/ui` dialog primitives, FormSubmit.co for email delivery without a custom backend.",
    productRequirements:
      "- Three routes: splash, home, projects\n- Project detail pages\n- Required-field CV dialog\n- Accessible modal focus trap",
    analytics:
      "Optional: add Plausible or Vercel Analytics later; currently no third-party trackers.",
    prodUrl: null,
    stage: "Public Access",
    repoUrl:
      "https://github.com/GetRaider/idea-monorepo/tree/main/apps/personal-website",
  },
];

export function getProjectBySlug(slug: string): PortfolioProject | undefined {
  return projects.find((project) => project.slug === slug);
}
