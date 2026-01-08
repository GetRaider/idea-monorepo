import { DecomposeTaskInput } from "../schemas";
import { PROMPT_RULES, PROMPT_GUIDELINES, PROMPT_OPTIONS } from "./constants";

export function buildDecomposePrompt(input: DecomposeTaskInput): string {
  const descriptionLine = input.description
    ? `Description: ${input.description}`
    : "";

  return `You are a task decomposition assistant. Break down the following task into smaller, atomic, actionable subtasks.

TASK:
Title: ${input.title}
${descriptionLine}

RULES:
${PROMPT_RULES.JSON_ONLY}
- Each subtask must be atomic (single action, completable in one session)
- Each subtask must have a clear, actionable verb (e.g., "Create", "Implement", "Write", "Configure")
- Do NOT use vague verbs like "Handle", "Manage", "Process", "Deal with"
${PROMPT_RULES.NO_INVENTION}
- Do NOT add testing, documentation, or deployment tasks unless explicitly mentioned
- Maximum 7 subtasks
- Minimum 1 subtask
- The description of each subtask should expand on the title with clear, actionable details
- Do NOT include subtasks that are outside the scope of the main task

${PROMPT_GUIDELINES.PRIORITY}

OUTPUT FORMAT:
{
  "tasks": [
    {
      "title": "string - concise action title (max 100 characters)",
      "description": "string - detailed explanation of what needs to be done",
      "priority": ${PROMPT_OPTIONS.PRIORITY}
    }
  ]
}

Respond with the JSON object only.`;
}
