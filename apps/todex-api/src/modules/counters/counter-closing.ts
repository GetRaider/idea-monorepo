import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { addDaysToDate } from "@repo/api/todex";

import {
  counterDays,
  counterOccurrences,
  counters,
  type CounterRow,
} from "../../db/schema";
import { settleDay } from "./counter-days";
import { isScheduled, localDate } from "./counter-schedule";
import { applyRule } from "./counter-view";

/** Serializes every writer of one Counter. Must run inside a transaction. */
export async function lockCounter(
  tx: NodePgDatabase,
  counterId: string,
): Promise<CounterRow | undefined> {
  const [counter] = await tx
    .select()
    .from(counters)
    .where(eq(counters.id, counterId))
    .for("update");
  return counter;
}

/**
 * Closes every day before today, oldest first. The caller holds the Counter row
 * lock, so reruns find the cursor already advanced.
 */
export async function closeEndedDays(
  tx: NodePgDatabase,
  counter: CounterRow,
  now: Date,
): Promise<CounterRow> {
  if (!hasEndedDay(counter, now)) return counter;
  const yesterday = addDaysToDate(localDate(now, counter.timeZone), -1);
  let current = counter;
  for (
    let date = addDaysToDate(counter.closedThrough, 1);
    date <= yesterday;
    date = addDaysToDate(date, 1)
  ) {
    if (!isScheduled(current.schedule, current.anchorDate, date)) continue;
    const day = { date, target: current.target, required: true };
    await saveDay(tx, current.id, day, now);
    // A waiting change starts the day after the one it was made on.
    if (current.pendingChange) {
      current = applyRule(
        current,
        current.pendingChange,
        addDaysToDate(date, 1),
      );
    }
  }
  return saveCounter(tx, { ...current, closedThrough: yesterday }, now);
}

/**
 * Writes a day from its hand and Task entries and rebuilds its default fails.
 * Rerun whenever a saved day changes. A day marked by choice is dropped once it
 * holds nothing.
 */
export async function saveDay(
  tx: NodePgDatabase,
  counterId: string,
  day: DayToSave,
  now: Date,
): Promise<void> {
  const onDate = and(
    eq(counterOccurrences.counterId, counterId),
    eq(counterOccurrences.localDate, day.date),
  );
  await tx
    .delete(counterOccurrences)
    .where(and(onDate, eq(counterOccurrences.source, "system")));
  const entries = await tx
    .select({ status: counterOccurrences.status })
    .from(counterOccurrences)
    .where(onDate);
  if (!day.required && entries.length === 0) {
    await tx
      .delete(counterDays)
      .where(
        and(
          eq(counterDays.counterId, counterId),
          eq(counterDays.localDate, day.date),
        ),
      );
    return;
  }
  const { defaultFails, ...settlement } = settleDay(
    day.target,
    day.required,
    entries,
  );
  const totals = {
    target: day.target,
    required: day.required,
    ...settlement,
  };
  await tx
    .insert(counterDays)
    .values({
      id: randomUUID(),
      counterId,
      localDate: day.date,
      createdAt: now,
      ...totals,
    })
    .onConflictDoUpdate({
      target: [counterDays.counterId, counterDays.localDate],
      set: totals,
    });
  if (defaultFails > 0) {
    await tx.insert(counterOccurrences).values(
      Array.from({ length: defaultFails }, () => ({
        id: randomUUID(),
        counterId,
        localDate: day.date,
        status: "failed" as const,
        source: "system" as const,
        createdAt: now,
      })),
    );
  }
}

export async function saveCounter(
  tx: NodePgDatabase,
  counter: CounterRow,
  now: Date,
): Promise<CounterRow> {
  const saved = { ...counter, updatedAt: now };
  await tx.update(counters).set(saved).where(eq(counters.id, counter.id));
  return saved;
}

export function hasEndedDay(counter: CounterRow, now: Date): boolean {
  if (counter.status !== "active") return false;
  const today = localDate(now, counter.timeZone);
  return counter.closedThrough < addDaysToDate(today, -1);
}

export interface DayToSave {
  date: string;
  target: number;
  required: boolean;
}
