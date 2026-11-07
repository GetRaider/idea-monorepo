import { ConflictException } from "@nestjs/common";
import { and, eq, gt, inArray, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { jobs, taskLifecycleLocks, tasks } from "../../db/schema";
import { executionSessionTasks } from "../../db/schema";

export const LIFECYCLE_LEASE_MS = 2 * 60 * 1000;

export class TaskLifecycleException extends ConflictException {
  constructor(
    code: LifecycleCode,
    extra?: { version?: number },
  ) {
    super({ message: code, code, ...extra });
  }
}

export async function lockTaskRows(
  tx: NodePgDatabase,
  taskIds: string[],
): Promise<void> {
  const ordered = [...new Set(taskIds)].filter(Boolean).sort();
  if (ordered.length === 0) return;
  await tx.execute(sql`
    SELECT id FROM tasks
    WHERE id IN (${sql.join(
      ordered.map((id) => sql`${id}`),
      sql`, `,
    )})
    ORDER BY id
    FOR UPDATE
  `);
}

export async function assertNoLiveLifecycleLock(
  tx: NodePgDatabase,
  taskIds: string[],
): Promise<void> {
  await lockTaskRows(tx, taskIds);
  if (await hasLiveLock(tx, taskIds)) {
    throw new TaskLifecycleException("lifecycle_in_progress");
  }
}

export async function hasLiveLock(
  tx: NodePgDatabase,
  taskIds: string[],
): Promise<boolean> {
  if (taskIds.length === 0) return false;
  const rows = await tx
    .select({ taskId: taskLifecycleLocks.taskId })
    .from(taskLifecycleLocks)
    .where(
      and(
        inArray(taskLifecycleLocks.taskId, taskIds),
        gt(taskLifecycleLocks.expiresAt, sql`clock_timestamp()`),
      ),
    );
  return rows.length > 0;
}

export async function executionIsActive(
  tx: NodePgDatabase,
  taskIds: string[],
): Promise<boolean> {
  if (taskIds.length === 0) return false;
  const links = await tx
    .select({ intervals: executionSessionTasks.intervals })
    .from(executionSessionTasks)
    .where(inArray(executionSessionTasks.taskId, taskIds));
  if (
    links.some((link) =>
      (link.intervals ?? []).some((interval) => interval.endedAt == null),
    )
  ) {
    return true;
  }
  const running = await tx
    .select({ id: jobs.id })
    .from(jobs)
    .where(
      and(
        eq(jobs.focalType, "task"),
        inArray(jobs.focalId, taskIds),
        inArray(jobs.status, ["running", "awaiting_confirmation"]),
      ),
    );
  return running.length > 0;
}

export async function refreshLease(
  tx: NodePgDatabase,
  taskIds: string[],
  transitionId: string,
): Promise<boolean> {
  const next = new Date(Date.now() + LIFECYCLE_LEASE_MS);
  for (const taskId of taskIds) {
    const updated = await tx
      .update(taskLifecycleLocks)
      .set({ expiresAt: next })
      .where(
        and(
          eq(taskLifecycleLocks.taskId, taskId),
          eq(taskLifecycleLocks.transitionId, transitionId),
          gt(taskLifecycleLocks.expiresAt, sql`clock_timestamp()`),
        ),
      )
      .returning({ taskId: taskLifecycleLocks.taskId });
    if (updated.length === 0) return false;
  }
  return true;
}

export async function parentIdsForChildSet(
  tx: NodePgDatabase,
  taskId: string | null,
  nextParentId: string | null,
): Promise<string[]> {
  const ids = new Set<string>();
  if (nextParentId) ids.add(nextParentId);
  if (taskId) {
    const [row] = await tx
      .select({ parentTaskId: tasks.parentTaskId })
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);
    if (row?.parentTaskId) ids.add(row.parentTaskId);
  }
  return [...ids];
}

export type LifecycleCode =
  | "execution_still_active"
  | "lifecycle_in_progress"
  | "conflict"
  | "lease_expired";
