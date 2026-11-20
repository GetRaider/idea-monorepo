import {
  isoDateSchema,
  isoWeekday,
  isScheduledWeekday,
  localDateInTimeZone,
  timeZoneSchema,
  type HabitStatus,
} from '@repo/evolin-shared';

export function validatePracticeDate(input: PracticeDateInput): void {
  isoDateSchema.parse(input.date);
  timeZoneSchema.parse(input.timeZone);

  const today = localDateInTimeZone(input.now, input.timeZone);
  if (input.date > today) throw new PracticeDateInFutureError();

  const createdDate = localDateInTimeZone(input.createdAt, input.timeZone);
  if (input.date < createdDate) throw new PracticeNotAllowedError();

  if (!isDateDuringEstablishing(input.date, input.timeZone, input.events)) {
    throw new PracticeNotAllowedError();
  }
}

export function assertPracticeInsertIsScheduled(
  date: string,
  timeZone: string,
  weekdays: readonly number[] | null,
): void {
  if (!isScheduledWeekday(weekdays, isoWeekday(date, timeZone))) {
    throw new PracticeNotScheduledError();
  }
}

export function isDateDuringEstablishing(
  date: string,
  timeZone: string,
  events: readonly StatusEvent[],
): boolean {
  for (let eventIndex = 0; eventIndex < events.length; eventIndex += 1) {
    const event = events[eventIndex];
    if (!event || event.toStatus !== 'establishing') continue;

    const nextEvent = events[eventIndex + 1];
    const intervalStart = localDateInTimeZone(event.occurredAt, timeZone);
    const intervalEnd = nextEvent
      ? localDateInTimeZone(nextEvent.occurredAt, timeZone)
      : null;

    if (date >= intervalStart && (intervalEnd == null || date <= intervalEnd)) {
      return true;
    }
  }

  return false;
}

export function recentDates(endingDate: string, count: number): string[] {
  const end = new Date(`${isoDateSchema.parse(endingDate)}T00:00:00.000Z`);

  return Array.from({ length: count }, (_, offset) => {
    const date = new Date(end);
    date.setUTCDate(end.getUTCDate() - (count - offset - 1));
    return date.toISOString().slice(0, 10);
  });
}

export class PracticeNotAllowedError extends Error {
  constructor() {
    super('Practice can only be changed for an establishing day.');
    this.name = 'PracticeNotAllowedError';
  }
}

export class PracticeNotScheduledError extends Error {
  constructor() {
    super('This date is not in the current schedule.');
    this.name = 'PracticeNotScheduledError';
  }
}

export class PracticeDateInFutureError extends Error {
  constructor() {
    super('Practice cannot be recorded for a future date.');
    this.name = 'PracticeDateInFutureError';
  }
}

export type StatusEvent = {
  toStatus: HabitStatus;
  occurredAt: Date;
};

type PracticeDateInput = {
  date: string;
  timeZone: string;
  now: Date;
  createdAt: Date;
  events: readonly StatusEvent[];
};
