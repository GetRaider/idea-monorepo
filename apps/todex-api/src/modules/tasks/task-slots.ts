import { BadRequestException } from "@nestjs/common";

export const MAX_SCHEDULE_SLOTS = 10;
export const MIN_TIMED_SLOT_MINUTES = 15;

export function assertScheduleSlots(
  slots: Array<{ startAt: string; endAt: string }>,
): void {
  if (slots.length > MAX_SCHEDULE_SLOTS) {
    throw new BadRequestException("A task can have at most 10 schedule slots");
  }
  const seen = new Set<string>();
  for (const slot of slots) {
    const start = Date.parse(slot.startAt);
    const end = Date.parse(slot.endAt);
    if (Number.isNaN(start) || Number.isNaN(end) || !(end > start)) {
      throw new BadRequestException("endAt must be after startAt");
    }
    if ((end - start) / 60_000 < MIN_TIMED_SLOT_MINUTES) {
      throw new BadRequestException("Timed slots are at least 15 minutes");
    }
    const key = `${start}:${end}`;
    if (seen.has(key)) {
      throw new BadRequestException("Duplicate schedule slot");
    }
    seen.add(key);
  }
}

export function rangesOverlap(
  start: Date,
  end: Date,
  otherStart: Date,
  otherEnd: Date,
): boolean {
  return start < otherEnd && end > otherStart;
}
