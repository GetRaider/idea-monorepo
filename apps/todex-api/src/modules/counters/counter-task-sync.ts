import { randomUUID } from "crypto";
import { and, eq, gte, inArray, or } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import {
  counterDays,
  counterLinks,
  counterOccurrences,
  counters,
  type TaskRow,
} from "../../db/schema";
import { closeEndedDays, lockCounter, saveDay } from "./counter-closing";
import { localDate } from "./counter-schedule";
import { targetResolver } from "./counter-view";

/**
 * Call inside the transaction that moves a Task to Done. Each Counter linked to
 * the Task, or counting its space, gets one completion dated today in its time
 * zone, as long as today is scheduled and still has room.
 */
export async function recordTaskCompletion(
  tx: NodePgDatabase,
  task: CompletedTask,
  now: Date,
): Promise<void> {
  for (const counterId of await countersFor(tx, task)) {
    const locked = await lockCounter(tx, counterId);
    if (!locked) continue;
    const counter = await closeEndedDays(tx, locked, now);
    if (counter.status !== "active") continue;
    const today = localDate(now, counter.timeZone);
    const saved = await savedDay(tx, counterId, today);
    const target = targetResolver(counter, saved ? [saved] : [], today)(today);
    if (target === null) continue;
    const entries = await tx
      .select()
      .from(counterOccurrences)
      .where(
        and(
          eq(counterOccurrences.counterId, counterId),
          or(
            eq(counterOccurrences.taskId, task.id),
            eq(counterOccurrences.localDate, today),
          ),
        ),
      );
    if (entries.some((entry) => entry.taskId === task.id)) continue;
    const todaysEntries = entries.filter((entry) => entry.localDate === today);
    // Any hand-set fail or skip of today gives way to the completion.
    const replaced = todaysEntries.filter(
      (entry) => entry.status !== "completed",
    );
    if (todaysEntries.length - replaced.length >= target) continue;
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
    if (saved || today <= counter.closedThrough) {
      const required = saved?.required ?? false;
      await saveDay(tx, counterId, { date: today, target, required }, now);
    }
  }
}

/**
 * Call inside the transaction that reopens or deletes Tasks. Today's
 * completions are removed. Earlier history stays, detached from the Task so a
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
    const counter = await closeEndedDays(tx, locked, now);
    const ownCompletions = and(
      eq(counterOccurrences.counterId, counterId),
      inArray(counterOccurrences.taskId, taskIds),
    );
    if (counter.status === "active") {
      const today = localDate(now, counter.timeZone);
      await tx
        .delete(counterOccurrences)
        .where(and(ownCompletions, gte(counterOccurrences.localDate, today)));
      const saved = await savedDay(tx, counterId, today);
      if (saved) {
        const day = { ...saved, date: today };
        await saveDay(tx, counterId, day, now);
      }
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

async function savedDay(tx: NodePgDatabase, counterId: string, date: string) {
  const [day] = await tx
    .select()
    .from(counterDays)
    .where(
      and(
        eq(counterDays.counterId, counterId),
        eq(counterDays.localDate, date),
      ),
    );
  return day;
}

/** A stable lock order keeps concurrent Task transitions from deadlocking. */
function orderedCounterIds(rows: { counterId: string }[]): string[] {
  return [...new Set(rows.map((row) => row.counterId))].sort();
}

type CompletedTask = Pick<
  TaskRow,
  "id" | "workspaceId" | "spaceId" | "seriesId" | "originSeriesId"
>;
