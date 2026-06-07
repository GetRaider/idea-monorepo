import type {
  CalendarBacklogType,
  CalendarEventType,
} from "@/types/calendar.types";

export function parseCalendarEventType(
  value: unknown,
): CalendarEventType | null {
  if (value === "timeBlock" || value === "common" || value === "task") {
    return value;
  }
  return null;
}

export function parseCalendarBacklogType(
  value: unknown,
): CalendarBacklogType | null {
  const type = parseCalendarEventType(value);
  if (type === "timeBlock" || type === "common") return type;
  return null;
}

export function parseCalendarEventTypeOrDefault(
  value: unknown,
  fallback: CalendarEventType = "timeBlock",
): CalendarEventType {
  return parseCalendarEventType(value) ?? fallback;
}
