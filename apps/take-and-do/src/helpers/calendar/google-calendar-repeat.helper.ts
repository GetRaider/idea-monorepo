import type { CalendarRepeatRule } from "@/types/calendar.types";

const REPEAT_TO_RRULE_FREQ: Record<CalendarRepeatRule, string> = {
  daily: "DAILY",
  weekly: "WEEKLY",
  monthly: "MONTHLY",
};

export function calendarRepeatToGoogleRecurrence(
  repeat: CalendarRepeatRule,
): string[] {
  return [`RRULE:FREQ=${REPEAT_TO_RRULE_FREQ[repeat]}`];
}

export function parseGoogleRecurrenceToCalendarRepeat(
  recurrence: unknown,
): CalendarRepeatRule | undefined {
  if (!Array.isArray(recurrence)) return undefined;

  for (const entry of recurrence) {
    if (typeof entry !== "string") continue;
    const trimmed = entry.trim();
    if (!/^RRULE:/i.test(trimmed)) continue;

    const body = trimmed.replace(/^RRULE:/i, "");
    const freqMatch = /(?:^|;)FREQ=([A-Z]+)/i.exec(body);
    if (!freqMatch) continue;

    switch (freqMatch[1].toUpperCase()) {
      case "DAILY":
        return "daily";
      case "WEEKLY":
        return "weekly";
      case "MONTHLY":
        return "monthly";
      default:
        break;
    }
  }

  return undefined;
}
