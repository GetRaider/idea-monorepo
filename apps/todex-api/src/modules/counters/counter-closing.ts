import { randomUUID } from "crypto";
import { and, between, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { addDaysToDate } from "@repo/api/todex";

import {
  counterOccurrences,
  counterPeriods,
  counters,
  type CounterRow,
} from "../../db/schema";
import {
  localDate,
  openPeriod,
  settlePeriod,
  type TrackedPeriod,
} from "./counter-periods";

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
 * Closes every period that ended before today, oldest first. The caller holds
 * the Counter row lock, so reruns find the cursor already advanced.
 */
export async function closeEndedPeriods(
  tx: NodePgDatabase,
  counter: CounterRow,
  now: Date,
): Promise<CounterRow> {
  if (!hasEndedPeriod(counter, now)) return counter;
  let current = counter;
  while (hasEndedPeriod(current, now)) {
    const period = openPeriod(
      current,
      current.anchorDate,
      current.closedThrough,
    );
    await settleSnapshot(
      tx,
      current.id,
      { ...period, target: current.target },
      now,
    );
    current = { ...current, ...advanceCursor(current, period.end) };
  }
  return saveCounter(tx, current, now);
}

/**
 * Writes the snapshot of a closed period from its hand and Task entries and
 * rebuilds its default fails. Rerun whenever such a period changes.
 */
export async function settleSnapshot(
  tx: NodePgDatabase,
  counterId: string,
  period: TrackedPeriod,
  now: Date,
): Promise<void> {
  const inPeriod = and(
    eq(counterOccurrences.counterId, counterId),
    between(counterOccurrences.localDate, period.start, period.end),
  );
  await tx
    .delete(counterOccurrences)
    .where(and(inPeriod, eq(counterOccurrences.source, "system")));
  const entries = await tx
    .select({
      date: counterOccurrences.localDate,
      status: counterOccurrences.status,
    })
    .from(counterOccurrences)
    .where(inPeriod);
  const settlement = settlePeriod(period, period.target, entries);
  const totals = {
    endDate: period.end,
    target: period.target,
    completed: settlement.completed,
    skipped: settlement.skipped,
    failed: settlement.failed,
    outcome: settlement.outcome,
  };
  await tx
    .insert(counterPeriods)
    .values({
      id: randomUUID(),
      counterId,
      startDate: period.start,
      createdAt: now,
      ...totals,
    })
    .onConflictDoUpdate({
      target: [counterPeriods.counterId, counterPeriods.startDate],
      set: totals,
    });
  if (settlement.failedDates.length > 0) {
    await tx.insert(counterOccurrences).values(
      settlement.failedDates.map((date) => ({
        id: randomUUID(),
        counterId,
        localDate: date,
        status: "failed" as const,
        source: "system" as const,
        createdAt: now,
      })),
    );
  }
}

/** Moves the cursor and lets a pending change take effect on the next day. */
export function advanceCursor(
  counter: CounterRow,
  closedThrough: string,
): CounterRow {
  const change = counter.pendingChange;
  if (!change) return { ...counter, closedThrough };
  const recurrenceChanged =
    change.frequency !== counter.frequency ||
    change.interval !== counter.interval;
  return {
    ...counter,
    ...change,
    closedThrough,
    pendingChange: null,
    anchorDate: recurrenceChanged
      ? addDaysToDate(closedThrough, 1)
      : counter.anchorDate,
  };
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

export function hasEndedPeriod(counter: CounterRow, now: Date): boolean {
  if (counter.status !== "active") return false;
  const period = openPeriod(counter, counter.anchorDate, counter.closedThrough);
  return period.end < localDate(now, counter.timeZone);
}
