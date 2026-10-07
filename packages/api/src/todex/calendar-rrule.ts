import type { TaskRecurrence, TaskWeekday } from "./recurrence.ts";
import { TASK_WEEKDAYS } from "./recurrence.ts";

const FREQ_TO_RULE = {
  DAILY: "daily",
  WEEKLY: "weekly",
  MONTHLY: "monthly",
  YEARLY: "yearly",
} as const;

export function recurrenceToRrule(rule: TaskRecurrence): string {
  const parts = [
    `FREQ=${rule.frequency.toUpperCase()}`,
    `INTERVAL=${rule.interval}`,
  ];
  if (rule.frequency === "weekly" && rule.weekdays?.length) {
    parts.push(`BYDAY=${rule.weekdays.join(",")}`);
  }
  if (rule.end.type === "count") parts.push(`COUNT=${rule.end.count}`);
  if (rule.end.type === "until") {
    parts.push(`UNTIL=${rule.end.until.replace(/-/g, "")}`);
  }
  return `RRULE:${parts.join(";")}`;
}

export function rruleToRecurrence(
  recurrence: string[] | undefined,
  timeZone: string,
): TaskRecurrence | null {
  const rules = (recurrence ?? []).filter((entry) =>
    entry.trim().toUpperCase().startsWith("RRULE:"),
  );
  const ruleText = rules[0];
  if (!ruleText || rules.length !== 1) return null;
  const body = ruleText.trim().replace(/^RRULE:/i, "");
  const fields = new Map<string, string>();
  for (const part of body.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) return null;
    fields.set(
      part.slice(0, separator).trim().toUpperCase(),
      part.slice(separator + 1).trim(),
    );
  }
  const frequency = FREQ_TO_RULE[fields.get("FREQ") as keyof typeof FREQ_TO_RULE];
  if (!frequency) return null;
  const interval = Number(fields.get("INTERVAL") ?? "1");
  if (!Number.isInteger(interval) || interval < 1 || interval > 99) return null;
  const weekdays = parseWeekdays(fields.get("BYDAY"));
  if (fields.has("BYDAY") && !weekdays) return null;
  if (weekdays && frequency !== "weekly") return null;
  const countText = fields.get("COUNT");
  const untilText = fields.get("UNTIL");
  if (countText && untilText) return null;
  const known = new Set(["FREQ", "INTERVAL", "BYDAY", "COUNT", "UNTIL", "WKST"]);
  for (const key of fields.keys()) {
    if (!known.has(key)) return null;
  }
  let end: TaskRecurrence["end"] = { type: "never" };
  if (countText) {
    const count = Number(countText);
    if (!Number.isInteger(count) || count < 1 || count > 999) return null;
    end = { type: "count", count };
  } else if (untilText) {
    const until = untilDate(untilText);
    if (!until) return null;
    end = { type: "until", until };
  }
  return {
    frequency,
    interval,
    ...(weekdays ? { weekdays } : {}),
    timeZone,
    end,
  };
}

function parseWeekdays(value: string | undefined): TaskWeekday[] | null {
  if (!value) return null;
  const weekdays = value.split(",").map((day) => day.trim().toUpperCase());
  if (weekdays.length === 0 || weekdays.length > 7) return null;
  const seen = new Set<string>();
  for (const weekday of weekdays) {
    if (!TASK_WEEKDAYS.includes(weekday as TaskWeekday) || seen.has(weekday)) {
      return null;
    }
    seen.add(weekday);
  }
  return weekdays as TaskWeekday[];
}

function untilDate(value: string): string | null {
  const match = /^(\d{4})(\d{2})(\d{2})/.exec(value);
  if (!match) return null;
  return `${match[1]}-${match[2]}-${match[3]}`;
}
