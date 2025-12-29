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
- Priority must be one of: "low", "medium", "high", "critical"

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



