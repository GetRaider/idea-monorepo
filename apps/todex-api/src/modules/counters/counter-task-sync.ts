import { randomUUID } from "crypto";
import { and, between, eq, gte, inArray, or } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import {
  counterLinks,
  counterOccurrences,
  counters,
  type TaskRow,
} from "../../db/schema";
import { closeEndedPeriods, lockCounter } from "./counter-closing";
import { dayCapacity, localDate } from "./counter-periods";
import { trackedPeriod } from "./counter-view";

/**
 * Call inside the transaction that moves a Task to Done. Each Counter linked to
 * the Task, or counting its space, gets one completion dated today in its time
 * zone, as long as the day and the Target still have room.
 */
export async function recordTaskCompletion(
  tx: NodePgDatabase,
  task: CompletedTask,
  now: Date,
): Promise<void> {
  for (const counterId of await countersFor(tx, task)) {
    const locked = await lockCounter(tx, counterId);
    if (!locked) continue;
    const counter = await closeEndedPeriods(tx, locked, now);
    const period = trackedPeriod(counter);
    const today = localDate(now, counter.timeZone);
    // Archived, or restored and still waiting for the next period.
    if (!period || today < period.start) continue;
    const entries = await tx
      .select()
      .from(counterOccurrences)
      .where(
        and(
          eq(counterOccurrences.counterId, counterId),
          or(
            eq(counterOccurrences.taskId, task.id),
            between(counterOccurrences.localDate, period.start, period.end),
          ),
        ),
      );
    if (entries.some((entry) => entry.taskId === task.id)) continue;
    const todaysEntries = entries.filter((entry) => entry.localDate === today);
    // Any hand-set fail or skip of today gives way to the completion.
    const replaced = todaysEntries.filter(
      (entry) => entry.status !== "completed",
    );
    const doneToday = todaysEntries.length - replaced.length;
    const capacity = dayCapacity(period, counter.target);
    if (doneToday >= capacity) continue;
    if (entries.length - replaced.length >= counter.target) continue;
    if (replaced.length > 0) {
      await tx.delete(counterOccurrences).where(
        inArray(
          counterOccurrences.id,
          replaced.map((entry) => entry.id),
        ),
      );
    }
    await tx.insert(counterOccurrences).values({
      id: randomUUID(),
      counterId,
      localDate: today,
      status: "completed",
      source: "task",
      taskId: task.id,
      createdAt: now,
    });
  }
}

/**
 * Call inside the transaction that reopens or deletes Tasks. Completions in an
 * open period are removed. Closed history stays, detached from the Task so a
 * later completion can be recorded again.
 */
export async function revertTaskCompletions(
  tx: NodePgDatabase,
  taskIds: string[],
  now: Date,
): Promise<void> {
  if (taskIds.length === 0) return;
  const affected = await tx
    .select({ counterId: counterOccurrences.counterId })
    .from(counterOccurrences)
    .where(inArray(counterOccurrences.taskId, taskIds));
  for (const counterId of orderedCounterIds(affected)) {
    const locked = await lockCounter(tx, counterId);
    if (!locked) continue;
    const period = trackedPeriod(await closeEndedPeriods(tx, locked, now));
    const ownCompletions = and(
      eq(counterOccurrences.counterId, counterId),
      inArray(counterOccurrences.taskId, taskIds),
    );
    if (period) {
      await tx
        .delete(counterOccurrences)
        .where(
          and(ownCompletions, gte(counterOccurrences.localDate, period.start)),
        );
    }
    await tx
      .update(counterOccurrences)
      .set({ taskId: null })
      .where(ownCompletions);
  }
}

/** A Task that starts repeating is counted through its series from then on. */
export async function moveTaskLinksToSeries(
  tx: NodePgDatabase,
  taskId: string,
  seriesId: string,
): Promise<void> {
  await tx
    .update(counterLinks)
    .set({ taskId: null, seriesId })
    .where(eq(counterLinks.taskId, taskId));
}

/** Active Counters that count this Task, in locking order. */
async function countersFor(
  tx: NodePgDatabase,
  task: CompletedTask,
): Promise<string[]> {
  const seriesIds = [task.seriesId, task.originSeriesId].filter(
    (seriesId): seriesId is string => seriesId !== null,
  );
  const linked = await tx
    .select({ counterId: counterLinks.counterId })
    .from(counterLinks)
    .innerJoin(counters, eq(counters.id, counterLinks.counterId))
    .where(
      and(
        eq(counters.workspaceId, task.workspaceId),
        eq(counters.status, "active"),
        or(
          eq(counterLinks.taskId, task.id),
          inArray(counterLinks.seriesId, seriesIds),
        ),
      ),
    );
  const watchingSpace = await tx
    .select({ counterId: counters.id })
    .from(counters)
    .where(
      and(
        eq(counters.workspaceId, task.workspaceId),
        eq(counters.status, "active"),
        eq(counters.spaceId, task.spaceId),
        eq(counters.countsSpaceTasks, true),
      ),
    );
  return orderedCounterIds([...linked, ...watchingSpace]);
}

/** A stable lock order keeps concurrent Task transitions from deadlocking. */
function orderedCounterIds(rows: { counterId: string }[]): string[] {
  return [...new Set(rows.map((row) => row.counterId))].sort();
}

type CompletedTask = Pick<
  TaskRow,
  "id" | "workspaceId" | "spaceId" | "seriesId" | "originSeriesId"
>;
