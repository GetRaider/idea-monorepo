import { DecomposeTaskInput } from "../schemas";

export function buildDecomposePrompt(input: DecomposeTaskInput): string {
  const descriptionLine = input.description
    ? `Description: ${input.description}`
    : "";

  return `You are a task decomposition assistant. Break down the following task into smaller, atomic, actionable subtasks.

TASK:
Title: ${input.title}
${descriptionLine}

RULES:
- Return ONLY valid JSON, no additional text or markdown
- Each subtask must be atomic (single action, completable in one session)
- Each subtask must have a clear, actionable verb (e.g., "Create", "Implement", "Write", "Configure")
- Do NOT use vague verbs like "Handle", "Manage", "Process", "Deal with"
- Do NOT invent requirements not implied by the task
- Do NOT add testing, documentation, or deployment tasks unless explicitly mentioned
- Maximum 7 subtasks
- Minimum 1 subtask
- Each subtask must have a priority: "low", "medium", "high", or "critical"
- Priority inference rules:
    - "critical": task is blocking, urgent, or has immediate impact
    - "high": task is important and time-sensitive
    - "medium": important but not urgent (default if no urgency indicators)
    - "low": optional or deferrable work
- The description of each subtask should expand on the title with clear, actionable details
- Do NOT include subtasks that are outside the scope of the main task

OUTPUT FORMAT:
{
  "tasks": [
    {
      "title": "string - concise action title",
      "description": "string - detailed explanation of what needs to be done",
      "priority": "low" | "medium" | "high" | "critical"
    }
  ]
}

Respond with the JSON object only.`;
}
