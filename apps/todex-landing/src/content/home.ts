export const ONBOARDING_EXAMPLE = {
  task: "Add a sample project to onboarding",
  source: "Onboarding interview notes",
  criteria: [
    "Offer a sample project before setup",
    "Let users skip straight to their own project",
  ],
  fragmentedWorkflow: [
    { tool: "ChatGPT", detail: "People wanted to see an example before setting up their own project." },
    { tool: "Task board", detail: "Improve onboarding." },
    { tool: "Cursor", detail: "What exactly are we changing, and why?" },
  ],
} as const;
