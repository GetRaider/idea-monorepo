export const HOME_COPY = {
  headlineLead: "Go from idea to execution",
  headlineRest: "with the context intact.",
  description:
    "Todex connects research, planning, and execution in one workspace for you and your AI agents. Keep the decisions behind each task, see what’s in progress, and carry what you learn into the next iteration.",
  problem: {
    title: "Every handoff makes you rebuild the context.",
    description:
      "The reasoning lives in a chat, the priority lives on a task board, and the implementation happens somewhere else. When you pick up the work or hand it to an agent, you have to piece together what matters, why it matters, and what’s already done.",
  },
} as const;

export const ONBOARDING_EXAMPLE = {
  task: "Add a sample project to onboarding",
  source: "Onboarding interview notes",
  criteria: [
    "Offer a sample project before setup",
    "Let users skip straight to their own project",
  ],
  fragmentedWorkflow: [
    { tool: "Research chat", detail: "People wanted to see an example before setting up their own project." },
    { tool: "Task board", detail: "Improve onboarding." },
    { tool: "Coding session", detail: "What should I build first, and how will I know it’s done?" },
  ],
  result: "Sample project added. Setup remains optional.",
  followUp: "Check whether first-time users can reach the sample on their own.",
} as const;
