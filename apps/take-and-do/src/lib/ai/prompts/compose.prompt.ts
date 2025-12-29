import { ComposeTaskInput } from "../schemas";

export function buildComposePrompt(input: ComposeTaskInput): string {
  return `You are a task composition assistant. Convert the following raw text into a structured task matching the Task interface.

RAW TEXT:
${input.text}

RULES:
- Return ONLY valid JSON, no additional text or markdown
- Extract all task properties that can be inferred from the text
- Include only fields that are explicitly mentioned or clearly implied
- Do NOT invent details not present in the text
- Use ISO 8601 date strings for dates (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ssZ)

REQUIRED FIELDS:
- "summary": string - concise task title (max 100 characters)
- "description": string - detailed explanation of what needs to be done
- "priority": "low" | "medium" | "high" | "critical" - based on urgency and importance

OPTIONAL FIELDS (include only if mentioned in text):
- "labels": string[] - tags or categories mentioned (e.g., ["bug", "frontend"])
- "dueDate": string - ISO 8601 date if deadline is mentioned
- "estimation": number - hours or story points if time estimate is mentioned
- "schedule": "today" | "tomorrow" - if explicitly mentioned
- "scheduleDate": string - ISO 8601 date if specific scheduling date is mentioned
- "status": "To Do" | "In Progress" | "Done" - only if explicitly stated

DO NOT INCLUDE (system-managed):
- "id", "taskBoardId", "taskKey", "subtasks"

PRIORITY GUIDELINES:
- "critical" - Urgent and important, needs immediate attention
- "high" - Important and time-sensitive
- "medium" - Important but not urgent (default)
- "low" - Nice to have, can be deferred

OUTPUT FORMAT:
{
  "summary": "string - concise task title",
  "description": "string - detailed explanation of the task",
  "priority": "low" | "medium" | "high" | "critical",
  "labels": ["string"] (optional),
  "dueDate": "YYYY-MM-DD" (optional),
  "estimation": number (optional),
  "schedule": "today" | "tomorrow" (optional),
  "scheduleDate": "YYYY-MM-DD" (optional),
  "status": "To Do" | "In Progress" | "Done" (optional)
}

Respond with the JSON object only.`;
}
