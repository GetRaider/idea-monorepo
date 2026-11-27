import { and, desc, eq, inArray, or } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import {
  counterLinks,
  counters,
  counterSpaces,
  tasks,
  type CounterLinkRow,
} from "../../db/schema";

/**
 * Each picked Task or series with the Task that stands for it now, whose space
 * is the one the link belongs to. A series is read from its latest Task.
 */
export async function resolveLinks(
  db: NodePgDatabase,
  workspaceId: string,
  links: readonly CounterLinkRow[],
): Promise<ResolvedLink[]> {
  if (links.length === 0) return [];
  const taskIds = links.flatMap((link) => link.taskId ?? []);
  const seriesIds = links.flatMap((link) => link.seriesId ?? []);
  const rows = await db
    .select({
      id: tasks.id,
      spaceId: tasks.spaceId,
      summary: tasks.summary,
      taskKey: tasks.taskKey,
      seriesId: tasks.seriesId,
      originSeriesId: tasks.originSeriesId,
    })
    .from(tasks)
    .where(
      and(
        eq(tasks.workspaceId, workspaceId),
        or(
          inArray(tasks.id, taskIds),
          inArray(tasks.seriesId, seriesIds),
          inArray(tasks.originSeriesId, seriesIds),
        ),
      ),
    )
    .orderBy(desc(tasks.createdAt), desc(tasks.id));
  return links.map((link) => ({
    link,
    task: rows.find((row) =>
      link.taskId
        ? row.id === link.taskId
        : row.seriesId === link.seriesId ||
          row.originSeriesId === link.seriesId,
    ),
  }));
}

/** Removes a Counter's picked Tasks that belong to the given spaces. */
export async function dropLinksInSpaces(
  tx: NodePgDatabase,
  workspaceId: string,
  counterId: string,
  spaceIds: readonly string[],
): Promise<void> {
  if (spaceIds.length === 0) return;
  const links = await tx
    .select()
    .from(counterLinks)
    .where(eq(counterLinks.counterId, counterId));
  const dropped = (await resolveLinks(tx, workspaceId, links)).filter(
    ({ task }) => task && spaceIds.includes(task.spaceId),
  );
  if (dropped.length === 0) return;
  await tx.delete(counterLinks).where(
    inArray(
      counterLinks.id,
      dropped.map(({ link }) => link.id),
    ),
  );
}

/**
 * Call before a space and its Tasks are deleted. A Counter left without spaces
 * stops counting any Task.
 */
export async function unlinkSpaceFromCounters(
  tx: NodePgDatabase,
  workspaceId: string,
  spaceId: string,
): Promise<void> {
  const linked = await tx
    .delete(counterSpaces)
    .where(eq(counterSpaces.spaceId, spaceId))
    .returning({ counterId: counterSpaces.counterId });
  for (const { counterId } of linked) {
    await dropLinksInSpaces(tx, workspaceId, counterId, [spaceId]);
    const remaining = await tx
      .select({ spaceId: counterSpaces.spaceId })
      .from(counterSpaces)
      .where(eq(counterSpaces.counterId, counterId));
    if (remaining.length > 0) continue;
    await tx
      .update(counters)
      .set({ countsAnyTask: false })
      .where(eq(counters.id, counterId));
  }
}

export interface ResolvedLink {
  link: CounterLinkRow;
  task: { spaceId: string; summary: string; taskKey: string } | undefined;
}
