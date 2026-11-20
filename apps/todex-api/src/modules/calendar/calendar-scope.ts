import { BadRequestException } from "@nestjs/common";
import { and, asc, eq, inArray } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { tasks } from "../../db/schema";

export const MIN_TIMED_EVENT_MS = 15 * 60 * 1000;

export function assertTimedEventRange(input: {
  allDay: boolean;
  start: Date;
  end: Date;
}) {
  if (input.allDay) return;
  if (input.end.getTime() - input.start.getTime() < MIN_TIMED_EVENT_MS) {
    throw new BadRequestException("Timed events must be at least 15 minutes");
  }
}

export function assertTaskScope(input: {
  spaceId: string | null;
  taskIds: string[];
  tasks: { id: string; spaceId: string }[];
}) {
  if (new Set(input.taskIds).size !== input.taskIds.length) {
    throw new BadRequestException("Duplicate task");
  }
  if (input.taskIds.length > 0 && !input.spaceId) {
    throw new BadRequestException("Select a space to add tasks");
  }
  if (input.tasks.length !== input.taskIds.length) {
    throw new BadRequestException("Unknown task in scope");
  }
  if (input.tasks.some((task) => task.spaceId !== input.spaceId)) {
    throw new BadRequestException("Task must belong to the event space");
  }
}

export function assertOneSpace(rows: { spaceId: string }[]) {
  const spaceIds = new Set(rows.map((row) => row.spaceId));
  if (spaceIds.size !== 1) {
    throw new BadRequestException("Tasks must belong to one space");
  }
  const [spaceId] = spaceIds;
  if (!spaceId) throw new BadRequestException("Tasks must belong to one space");
  return spaceId;
}

export function withoutTaskId(taskScope: string[], taskId: string) {
  return taskScope.filter((id) => id !== taskId);
}

export async function lockWorkspaceTasks(
  db: Pick<NodePgDatabase, "select">,
  workspaceId: string,
  taskIds: string[],
) {
  const ids = [...new Set(taskIds)].sort();
  if (ids.length === 0) return [];
  return db
    .select({ id: tasks.id, spaceId: tasks.spaceId })
    .from(tasks)
    .where(and(eq(tasks.workspaceId, workspaceId), inArray(tasks.id, ids)))
    .orderBy(asc(tasks.id))
    .for("update");
}
