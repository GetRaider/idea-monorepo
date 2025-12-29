import { ComposeTaskInput } from "../schemas";
import { PROMPT_RULES, PROMPT_GUIDELINES, PROMPT_OPTIONS } from "./constants";

export function buildComposePrompt(input: ComposeTaskInput): string {
  return `You are a task composition assistant. Convert the following raw text into a structured task matching the Task interface.

RAW TEXT:
${input.text}

RULES:
${PROMPT_RULES.JSON_ONLY}
- Extract all task properties that can be inferred from the text
- Include only fields that are explicitly mentioned or clearly implied
${PROMPT_RULES.NO_INVENTION}
${PROMPT_RULES.DATE_FORMAT}
${PROMPT_RULES.INFER_REASONABLE}

REQUIRED FIELDS:
- "summary": string - concise task title (max 100 characters)
- "description": string - detailed explanation of what needs to be done
- "priority": ${PROMPT_OPTIONS.PRIORITY} - based on urgency and importance

OPTIONAL FIELDS (include only if mentioned in text, omit if not present):
- "labels": string[] - tags or categories mentioned (e.g., ["bug", "frontend"])
- "dueDate": string - ISO 8601 date if deadline is mentioned
- "estimation": number - hours (default) or story points if explicitly stated
- "schedule": ${PROMPT_OPTIONS.SCHEDULE} - if explicitly mentioned
- "scheduleDate": string - ISO 8601 date if specific scheduling date is mentioned
- "status": ${PROMPT_OPTIONS.STATUS} - only if explicitly stated

IMPORTANT:
- Do NOT include optional fields with null values - omit them entirely if not present
- Do NOT include system-managed fields: "id", "taskBoardId", "taskKey", "subtasks"

${PROMPT_GUIDELINES.PRIORITY}

ADDITIONAL RULES:
- The description must expand on the summary with concrete intent or scope
- Do NOT repeat the summary verbatim in the description
- Include "estimation" only if a numeric estimate is explicitly mentioned
- If "schedule" is present, do NOT include "scheduleDate"
- Do NOT decompose the task into subtasks
- Do NOT infer task boards, workflows, or ownership

OUTPUT FORMAT:
{
  "summary": "string - concise task title",
  "description": "string - detailed explanation of the task",
  "priority": ${PROMPT_OPTIONS.PRIORITY},
  "labels": ["string"] (optional),
  "dueDate": "YYYY-MM-DD" (optional),
  "estimation": number (optional),
  "schedule": ${PROMPT_OPTIONS.SCHEDULE} (optional),
  "scheduleDate": "YYYY-MM-DD" (optional),
  "status": ${PROMPT_OPTIONS.STATUS} (optional)
}

Respond with the JSON object only.`;
}
