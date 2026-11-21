// Home copy comes from the Notion page "Todex — Core Product Thesis: Unified Context & Execution"
// and follows the landing rules: the headline is the user's result plus a hook, the subheadline
// explains how, every block is "what you can do", and each CTA names the action its heading promises.

export const HOME_COPY = {
  metaTitle: "Todex | From ideas to execution. Without losing context.",
  // Thesis external hypothesis. "Without losing context" is the hook: it answers the
  // "I'll have to re-explain everything at each step" objection.
  headlineLead: "From ideas to execution.",
  headlineRest: "Without losing context.",
  // Thesis supporting message.
  description:
    "Research, plan, and execute in one connected workspace. Keep humans and AI agents aligned with the same context, priorities, and progress.",
  heroSecondary: "See how it works",
  proof: {
    eyebrow: "Works with",
    title: "Keep your stack. Give it one shared context.",
    tools: ["ChatGPT", "Claude", "Cursor", "Claude Code"],
    note: "Todex doesn’t replace the tools you use. It gives them the right context through Todex MCP and keeps the state and results of the work.",
    trademarks:
      "ChatGPT, Claude, Claude Code, and Cursor are trademarks of their respective owners. Todex is not affiliated with or endorsed by them.",
  },
  problem: {
    eyebrow: "The problem",
    title: "Every tool holds a piece of the context. You hold the rest.",
    description:
      "Research lives in ChatGPT, decisions in docs, tasks in a tracker, and the code in Cursor. Each one has part of the picture, so you keep re-explaining what to build and why, lose track of priorities, and check each tool to see what’s actually done.",
  },
  values: {
    eyebrow: "Why Todex",
    title: "One context for you and your AI agents.",
    description:
      "Connecting apps lets an agent read data. It doesn’t keep the meaning, the state of the work, or the results in one place. Todex does.",
  },
  workflow: {
    eyebrow: "Research · Plan · Execute · Learn",
    title: "From research to results, and back again.",
    description:
      "Start at any step: a finding, a decision, or a task you already have. You don’t need a goal or formal research first.",
  },
  objections: {
    eyebrow: "FAQ",
    title: "Fits how you already work.",
    items: [
      {
        question: "Do I have to move everything into Todex?",
        answer:
          "No. Keep researching in ChatGPT or Claude and building in Cursor. Todex holds the context and the results between them.",
      },
      {
        question: "Do I have to work with AI?",
        answer:
          "No. Plan tasks with estimates, work in Focus Mode with a timer, and update progress yourself. Agents are an option, not a requirement.",
      },
      {
        question: "Is Todex AI another ChatGPT?",
        answer:
          "No. It works on your Todex context: it searches your docs, drafts documents, breaks work into tasks, and records results. Deep research stays in the tools you already use.",
      },
      {
        question: "How does an agent get access?",
        answer:
          "You connect an MCP client with OAuth or a personal access token from Settings. It acts as you and only sees your workspace.",
      },
    ],
  },
  audiences: {
    eyebrow: "Use cases",
    title: "See how it fits your work.",
    linkLabel: "See the workflow",
  },
  closing: {
    // Rendered with the quiet words in gray and the highlight in silver.
    lead: "Start with",
    highlight: "one idea",
    rest: "and the research behind it.",
    description:
      "Built for solo founders and small AI-native product teams. Save what you found, plan the work, and hand it off with the context attached.",
  },
} as const;

// The thesis' concrete solo-founder scenario: competitor research in ChatGPT → Knowledge via MCP
// → MVP scope and tasks → Cursor pulls the task with its context → results come back to Todex.
export const FOUNDER_EXAMPLE = {
  space: "Invoicing for freelancers",
  task: "Build the invoice draft screen",
  criteria: [
    "Create a draft from a client and line items",
    "Export the draft as a PDF",
  ],
  references: [
    { href: "#research-note", label: "Competitor research", origin: "Saved from ChatGPT" },
    { href: "#workflow", label: "MVP scope", origin: "Decision" },
  ],
  handoff: {
    agent: "Cursor",
    steps: [
      "Read the task, its criteria, the MVP scope, and the competitor research",
      "Moved the task to review and attached an implementation summary",
    ],
  },
  fragmentedWorkflow: [
    { tool: "ChatGPT", detail: "Freelancers want fast invoices. Time tracking can wait." },
    { tool: "Task tracker", detail: "Build invoicing." },
    { tool: "Cursor", detail: "What’s in scope, and how will I know it’s done?" },
  ],
} as const;

export const VALUES = [
  {
    name: "Context continuity",
    title: "Stop re-explaining the work.",
    description:
      "You and your agents get the task with its linked research, decisions, and requirements.",
  },
  {
    name: "Execution visibility",
    title: "See what’s being done, by whom, and why.",
    description:
      "Status and results from people and agents land in one place, next to the plan they came from.",
  },
  {
    name: "Less coordination",
    title: "Stop copying between apps.",
    description:
      "Research, plans, tasks, and results stay linked, so there’s nothing to forward or reconcile by hand.",
  },
] as const;

export const WORKFLOW_STEPS = [
  {
    id: "research-note",
    module: "Research & capture",
    title: "Bring research in from where you do it.",
    description:
      "Research in ChatGPT or Claude and save the findings and sources through Todex MCP, or write them in Todex.",
    example: "Competitor research",
  },
  {
    module: "Knowledge",
    title: "Keep the why next to the work.",
    description: "Findings, requirements, and decisions stay linked as working context.",
    example: "MVP: invoices only",
  },
  {
    module: "Planning",
    title: "Turn context into a plan.",
    description: "Break it into tasks with estimates, priorities, and a definition of done.",
    example: "3 tasks, each with criteria",
  },
  {
    module: "Execution",
    title: "Do it yourself or hand it off.",
    description:
      "Work in Focus Mode with a timer, or let Cursor or Claude Code pull the task and its requirements through MCP.",
    example: FOUNDER_EXAMPLE.task,
  },
  {
    module: "Outcomes & feedback",
    title: "Start the next iteration from what you learned.",
    description:
      "Results, status, and new decisions go back into Todex and update the context for the next step.",
    example: "Drafts shipped. Time tracking stays out.",
  },
] as const;

export const AUDIENCES = [
  {
    id: "solo-founders",
    audience: "Solo founders",
    description: "Go from competitor research to an MVP built in Cursor without retelling the plan.",
  },
  {
    id: "small-teams",
    audience: "Small AI-native teams",
    description: "See what people and agents are working on, why, and what’s done.",
  },
  {
    id: "ai-assisted-builders",
    audience: "AI-assisted builders",
    description: "Give your coding agent the task, its criteria, and the decisions behind it.",
  },
] as const;

/**
 * Official logo files, unmodified, in `public/logos/`. Sizes keep each file's aspect ratio.
 * - Claude, Claude Code: Anthropic press kit (https://www.anthropic.com/press-kit), "One-color" variants.
 * - Cursor: https://cursor.com/brand, "Lockup Horizontal 2D Dark".
 * - ChatGPT: OpenAI publishes no ready-to-use logo file (https://openai.com/brand/ offers only the
 *   construction artwork and Photoshop partnership templates, and asks to request permission at
 *   partnercomms@openai.com), so it is shown as plain text.
 * Rules to respect: use logos exactly as provided, never larger than the Todex brand, and never
 * imply partnership or endorsement.
 */
export const TOOL_LOGOS = [
  { name: "ChatGPT" },
  { name: "Claude", src: "/logos/claude.svg", width: 101, height: 22 },
  { name: "Claude Code", src: "/logos/claude-code.svg", width: 146, height: 20 },
  { name: "Cursor", src: "/logos/cursor.svg", width: 101, height: 24 },
] as const;
