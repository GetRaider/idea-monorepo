import { TaskPriority, TaskStatus } from "@/components/KanbanBoard/types";

const PRIORITY_VALUES = Object.values(TaskPriority) as string[];
const STATUS_VALUES = Object.values(TaskStatus) as string[];
const SCHEDULE_VALUES = ["today", "tomorrow"] as const;

export const PROMPT_RULES = {
  JSON_ONLY: "- Return ONLY valid JSON, no additional text or markdown",
  NO_INVENTION: "- Do NOT invent details not present in the input",
  INFER_REASONABLE:
    "- If the input is unclear, infer the most reasonable interpretation",
  DATE_FORMAT:
    "- Use ISO 8601 date strings for dates (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ssZ)",
} as const;

export const PROMPT_OPTIONS = {
  PRIORITY: PRIORITY_VALUES.map((p) => `"${p}"`).join(" | "),
  STATUS: STATUS_VALUES.map((s) => `"${s}"`).join(" | "),
  SCHEDULE: SCHEDULE_VALUES.map((s) => `"${s}"`).join(" | "),
} as const;

export const PROMPT_VALUES = {
  PRIORITY: PRIORITY_VALUES,
  STATUS: STATUS_VALUES,
  SCHEDULE: SCHEDULE_VALUES,
} as const;

export const PROMPT_GUIDELINES = {
  PRIORITY: `- Priority must be one of: ${PROMPT_OPTIONS.PRIORITY}
- Priority inference rules:
  * "critical": Urgent and important, needs immediate attention (e.g., "ASAP", "blocking", "urgent", blocking issue)
  * "high": Important and time-sensitive, deadline-driven
  * "medium": Important but not urgent (default if no urgency indicators)
  * "low": Nice to have, can be deferred, optional work`,
} as const;
