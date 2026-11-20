import { formatOccurrenceLocalKey, zonedLocalDateTime } from "@repo/api/todex";
import type { ScheduleSlotInput, TaskRecurrence } from "@repo/api/todex";

const REPEAT_SLOT_MS = 60 * 60_000;

export function repeatSchedule(input: {
  recurrence: TaskRecurrence;
  slots: ScheduleSlotInput[];
  dueDate: string | null;
  now?: Date;
}): RepeatSchedule {
  const active = input.slots
    .filter((slot) => slot.retiredAt == null)
    .sort((left, right) => left.startAt.localeCompare(right.startAt));
  const earliest = active[0];
  if (earliest) {
    return { anchor: earliest.startAt, slots: null, slotOffsets: null };
  }
  const startAt =
    input.dueDate ??
    defaultRepeatStart(input.now ?? new Date(), input.recurrence.timeZone);
  const endAt = new Date(Date.parse(startAt) + REPEAT_SLOT_MS).toISOString();
  const added = { startAt, endAt };
  return {
    anchor: startAt,
    slots: [...input.slots, added],
    slotOffsets: slotOffsetsFor(startAt, [added], input.recurrence.timeZone),
  };
}

export function recurrenceForGeneratedTask(
  parentTaskId: string | null,
  rule: TaskRecurrence | null,
): TaskRecurrence | null {
  if (parentTaskId) return null;
  return rule;
}

function defaultRepeatStart(now: Date, timeZone: string): string {
  const date = formatOccurrenceLocalKey(now, timeZone).slice(0, 10);
  return zonedLocalDateTime(date, "09:00", timeZone).toISOString();
}

function slotOffsetsFor(
  anchorIso: string,
  slots: Array<{ startAt: string; endAt: string }>,
  timeZone: string,
): SlotOffset[] {
  const anchor = new Date(anchorIso);
  return slots.map((slot) => ({
    dayOffset: dayOffset(anchor, new Date(slot.startAt), timeZone),
    startLocal: formatOccurrenceLocalKey(
      new Date(slot.startAt),
      timeZone,
    ).slice(11, 16),
    endLocal: formatOccurrenceLocalKey(new Date(slot.endAt), timeZone).slice(
      11,
      16,
    ),
  }));
}

function dayOffset(anchor: Date, instant: Date, timeZone: string): number {
  const start = formatOccurrenceLocalKey(anchor, timeZone).slice(0, 10);
  const end = formatOccurrenceLocalKey(instant, timeZone).slice(0, 10);
  const startUtc = Date.parse(`${start}T00:00:00Z`);
  const endUtc = Date.parse(`${end}T00:00:00Z`);
  return Math.round((endUtc - startUtc) / 86_400_000);
}

interface SlotOffset {
  dayOffset: number;
  startLocal: string;
  endLocal: string;
}

export interface RepeatSchedule {
  anchor: string;
  slots: ScheduleSlotInput[] | null;
  slotOffsets: SlotOffset[] | null;
}
