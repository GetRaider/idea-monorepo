import { randomUUID } from "crypto";
import { and, eq, gte, inArray, or } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import {
  counterLinks,
  counterOccurrences,
  counters,
  type TaskRow,
} from "../../db/schema";
import { closeEndedPeriods, lockCounter } from "./counter-closing";
import { localDate } from "./counter-periods";
import { trackedPeriod } from "./counter-view";

/**
 * Call inside the transaction that moves a Task to Done. Each linked active
 * Counter gets one completion per Task, dated today in its time zone.
 */
export async function recordTaskCompletion(
  tx: NodePgDatabase,
  task: CompletedTask,
  now: Date,
): Promise<void> {
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
  for (const counterId of orderedCounterIds(linked)) {
    const locked = await lockCounter(tx, counterId);
    if (!locked) continue;
    const counter = await closeEndedPeriods(tx, locked, now);
    const period = trackedPeriod(counter);
    const today = localDate(now, counter.timeZone);
    // Archived, or restored and still waiting for the next period.
    if (!period || today < period.start) continue;
    await tx
      .insert(counterOccurrences)
      .values({
        id: randomUUID(),
        counterId,
        localDate: today,
        status: "completed",
        source: "task",
        taskId: task.id,
        createdAt: now,
      })
      .onConflictDoNothing();
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

/** A stable lock order keeps concurrent Task transitions from deadlocking. */
function orderedCounterIds(rows: { counterId: string }[]): string[] {
  return [...new Set(rows.map((row) => row.counterId))].sort();
}

type CompletedTask = Pick<
  TaskRow,
  "id" | "workspaceId" | "seriesId" | "originSeriesId"
>;
