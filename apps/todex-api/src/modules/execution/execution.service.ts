import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { and, asc, desc, eq, gt, inArray, isNull, lt, max, or } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { randomUUID } from "crypto";
import { DocType } from "@repo/api/todex";
import {
  closeOpenIntervals,
  hasOpenInterval,
  sumIntervalSeconds,
} from "@repo/api/todex";
import type {
  ExecutionActivityQuery,
  ExecutionCurrent,
  ExecutionQueueTask,
  ExecutionTaskRef,
  UpdateExecutionSessionBody,
} from "@repo/api/todex";

import {
  mapExecutionQueueItem,
  mapExecutionSession,
  toIso,
} from "../../db/mappers";
import {
  boardAreas,
  boardProgressStages,
  docTasks,
  docs,
  executionQueue,
  executionSessions,
  executionSessionTasks,
  taskBoards,
  tasks,
} from "../../db/schema";
import type {
  ExecutionSessionRow,
  ExecutionSessionTaskRow,
  TaskRow,
} from "../../db/schema";
import { DRIZZLE_DB } from "../../db/tokens";
import {
  allocateSessionSpans,
  buildExecutionActivity,
} from "./execution-activity";

const SESSION_LIMIT = 500;

export function resolveSessionDuration(
  startedAt: Date,
  endedAt: Date,
  requested: number | undefined,
) {
  const wallSeconds = Math.max(
    0,
    Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000),
  );
  if (requested == null) return wallSeconds;
  return Math.min(wallSeconds, Math.max(0, Math.floor(requested)));
}

@Injectable()
export class ExecutionService {
  constructor(@Inject(DRIZZLE_DB) private readonly db: NodePgDatabase) {}

  async state(workspaceId: string) {
    const [open, queue] = await Promise.all([
      this.openRow(this.db, workspaceId),
      this.queue(this.db, workspaceId),
    ]);
    if (!open) return { session: null, tasks: [], focusedTaskId: null, queue };
    const links = await this.sessionLinks(this.db, open.id, true);
    const tasks = await this.taskDetails(this.db, workspaceId, links);
    return {
      session: mapExecutionSession(open, taskRefs(links, tasks)),
      tasks,
      focusedTaskId: focusedTask(links),
      queue,
    };
  }

  async sessions(workspaceId: string) {
    const rows = await this.db
      .select()
      .from(executionSessions)
      .where(eq(executionSessions.workspaceId, workspaceId))
      .orderBy(desc(executionSessions.startedAt))
      .limit(SESSION_LIMIT);
    if (rows.length === 0) return [];
    const links = await this.db
      .select({
        link: executionSessionTasks,
        taskKey: tasks.taskKey,
        summary: tasks.summary,
      })
      .from(executionSessionTasks)
      .innerJoin(tasks, eq(tasks.id, executionSessionTasks.taskId))
      .where(
        inArray(
          executionSessionTasks.sessionId,
          rows.map((row) => row.id),
        ),
      )
      .orderBy(asc(executionSessionTasks.position));
    return rows.map((row) =>
      mapExecutionSession(
        row,
        links
          .filter((link) => link.link.sessionId === row.id)
          .map((link) => ({
            id: link.link.taskId,
            taskKey: link.taskKey,
            summary: link.summary,
          })),
      ),
    );
  }

  async execute(workspaceId: string, taskIds: string[]) {
    const uniqueIds = [...new Set(taskIds)];
    if (uniqueIds.length !== taskIds.length) {
      throw new BadRequestException("Duplicate task");
    }
    if (taskIds.length === 0) {
      throw new BadRequestException("Select a task to start");
    }
    const now = new Date();
    await this.db.transaction(async (tx) => {
      const open = await this.openRow(tx, workspaceId);
      if (open) {
        throw new BadRequestException("An execution is already running");
      }
      const sessionId = randomUUID();
      await tx.insert(executionSessions).values({
        id: sessionId,
        workspaceId,
        startedAt: now,
        executorType: "human",
        createdAt: now,
        updatedAt: now,
      });
      await this.requireSameBoard(tx, workspaceId, taskIds);
      await tx.insert(executionSessionTasks).values(
        taskIds.map((taskId, index) => ({
          id: randomUUID(),
          sessionId,
          taskId,
          position: index,
          intervals:
            index === 0
              ? [{ startedAt: now.toISOString(), endedAt: null }]
              : [],
        })),
      );
      await tx
        .delete(executionQueue)
        .where(
          and(
            eq(executionQueue.workspaceId, workspaceId),
            inArray(executionQueue.taskId, taskIds),
          ),
        );
    });
    return this.state(workspaceId);
  }


  async focus(workspaceId: string, taskId: string) {
    const now = new Date();
    await this.db.transaction(async (tx) => {
      const open = await this.openRow(tx, workspaceId);
      if (!open) throw new BadRequestException("No active execution");
      const links = await this.sessionLinks(tx, open.id, true);
      const target = links.find((link) => link.taskId === taskId);
      if (!target) throw new BadRequestException("Task is not in this session");
      if (
        hasOpenInterval(target.intervals) &&
        links.every(
          (link) => link.taskId === taskId || !hasOpenInterval(link.intervals),
        )
      ) {
        return;
      }
      await this.closeTracking(tx, links, now);
      const closed = closeOpenIntervals(target.intervals, now);
      await tx
        .update(executionSessionTasks)
        .set({
          intervals: [
            ...closed,
            { startedAt: now.toISOString(), endedAt: null },
          ],
        })
        .where(eq(executionSessionTasks.id, target.id));
    });
    return this.state(workspaceId);
  }

  async pause(workspaceId: string) {
    const now = new Date();
    await this.db.transaction(async (tx) => {
      const open = await this.openRow(tx, workspaceId);
      if (!open) throw new BadRequestException("No active execution");
      const links = await this.sessionLinks(tx, open.id, true);
      await this.closeTracking(tx, links, now);
    });
    return this.state(workspaceId);
  }

  async resume(workspaceId: string) {
    const now = new Date();
    await this.db.transaction(async (tx) => {
      const open = await this.openRow(tx, workspaceId);
      if (!open) throw new BadRequestException("No active execution");
      const links = await this.sessionLinks(tx, open.id, true);
      if (links.some((link) => hasOpenInterval(link.intervals))) return;
      const taskId = focusedTask(links);
      const target = links.find((link) => link.taskId === taskId);
      if (!target) throw new BadRequestException("No task to resume");
      await tx
        .update(executionSessionTasks)
        .set({
          intervals: [
            ...target.intervals,
            { startedAt: now.toISOString(), endedAt: null },
          ],
        })
        .where(eq(executionSessionTasks.id, target.id));
    });
    return this.state(workspaceId);
  }

  async enqueue(workspaceId: string, taskId: string) {
    await this.requireTask(workspaceId, taskId);
    const [existing] = await this.db
      .select({ id: executionQueue.id })
      .from(executionQueue)
      .where(
        and(
          eq(executionQueue.workspaceId, workspaceId),
          eq(executionQueue.taskId, taskId),
        ),
      );
    if (existing) {
      throw new BadRequestException("Already in the execution queue");
    }
    const now = new Date();
    await this.db.transaction(async (tx) => {
      const [highest] = await tx
        .select({ value: max(executionQueue.position) })
        .from(executionQueue)
        .where(eq(executionQueue.workspaceId, workspaceId));
      await tx.insert(executionQueue).values({
        id: randomUUID(),
        workspaceId,
        taskId,
        position: (highest?.value ?? -1) + 1,
        createdAt: now,
      });
    });
    return this.state(workspaceId);
  }

  async reorder(workspaceId: string, taskIds: string[]) {
    const queued = await this.queue(this.db, workspaceId);
    const queuedIds = queued.map((item) => item.taskId);
    if (!sameTaskIds(queuedIds, taskIds)) {
      throw new BadRequestException("Queue order does not match");
    }
    await this.db.transaction(async (tx) => {
      for (const [index, taskId] of taskIds.entries()) {
        await tx
          .update(executionQueue)
          .set({ position: index })
          .where(
            and(
              eq(executionQueue.workspaceId, workspaceId),
              eq(executionQueue.taskId, taskId),
            ),
          );
      }
    });
    return this.state(workspaceId);
  }

  async removeQueued(workspaceId: string, taskId: string) {
    const [removed] = await this.db
      .delete(executionQueue)
      .where(
        and(
          eq(executionQueue.workspaceId, workspaceId),
          eq(executionQueue.taskId, taskId),
        ),
      )
      .returning({ id: executionQueue.id });
    if (!removed) throw new NotFoundException("Execution queue item");
    return this.state(workspaceId);
  }

  async complete(workspaceId: string) {
    const now = new Date();
    await this.db.transaction(async (tx) => {
      const open = await this.openRow(tx, workspaceId);
      if (!open) throw new BadRequestException("No active execution");
      const links = await this.sessionLinks(tx, open.id, true);
      await this.finishSession(tx, open, now);
      await this.restoreQueue(
        tx,
        workspaceId,
        links.map((link) => link.taskId),
        now,
      );
    });
    return this.state(workspaceId);
  }

  async activity(workspaceId: string, query: ExecutionActivityQuery) {
    const from = new Date(`${query.from}T00:00:00.000Z`);
    from.setUTCDate(from.getUTCDate() - 1);
    const to = new Date(`${query.to}T00:00:00.000Z`);
    to.setUTCDate(to.getUTCDate() + 2);
    const rows = await this.db
      .select({
        sessionId: executionSessions.id,
        intervals: executionSessionTasks.intervals,
        boardId: tasks.taskBoardId,
        boardName: taskBoards.name,
        areaId: tasks.areaId,
        areaName: boardAreas.name,
        isDefaultArea: boardAreas.isDefault,
      })
      .from(executionSessions)
      .innerJoin(
        executionSessionTasks,
        eq(executionSessionTasks.sessionId, executionSessions.id),
      )
      .innerJoin(tasks, eq(tasks.id, executionSessionTasks.taskId))
      .innerJoin(taskBoards, eq(taskBoards.id, tasks.taskBoardId))
      .innerJoin(boardAreas, eq(boardAreas.id, tasks.areaId))
      .where(
        and(
          eq(executionSessions.workspaceId, workspaceId),
          lt(executionSessions.startedAt, to),
          or(
            isNull(executionSessions.endedAt),
            gt(executionSessions.endedAt, from),
          ),
        ),
      );
    try {
      return buildExecutionActivity({
        slices: rows,
        from: query.from,
        to: query.to,
        timeZone: query.timeZone,
        boardId: query.boardId ?? null,
        now: new Date(),
      });
    } catch {
      throw new BadRequestException("Invalid range");
    }
  }

  async updateSession(
    workspaceId: string,
    sessionId: string,
    body: UpdateExecutionSessionBody,
  ) {
    const started = new Date(body.startedAt);
    const ended = new Date(body.endedAt);
    const duration = Math.floor((ended.getTime() - started.getTime()) / 1000);
    if (duration <= 0 || duration > 60 * 60 * 24 * 14) {
      throw new BadRequestException("Ended time must be after the start");
    }
    await this.db.transaction(async (tx) => {
      const row = await this.sessionRow(tx, workspaceId, sessionId);
      if (!row.endedAt) {
        throw new BadRequestException("Stop the session before editing it");
      }
      const links = await this.sessionLinks(tx, row.id);
      const spans = allocateSessionSpans(
        links.map((link) => sumIntervalSeconds(link.intervals ?? [], ended)),
        duration,
      );
      let cursor = started.getTime();
      for (const [index, link] of links.entries()) {
        const span = spans[index] ?? 0;
        const intervals =
          span === 0
            ? []
            : [
                {
                  startedAt: new Date(cursor).toISOString(),
                  endedAt: new Date(cursor + span * 1000).toISOString(),
                },
              ];
        cursor += span * 1000;
        await tx
          .update(executionSessionTasks)
          .set({ intervals })
          .where(eq(executionSessionTasks.id, link.id));
      }
      await tx
        .update(executionSessions)
        .set({
          startedAt: started,
          endedAt: ended,
          duration,
          updatedAt: new Date(),
        })
        .where(eq(executionSessions.id, row.id));
    });
    return this.sessions(workspaceId);
  }

  async deleteSession(workspaceId: string, sessionId: string) {
    const row = await this.sessionRow(this.db, workspaceId, sessionId);
    if (!row.endedAt) {
      throw new BadRequestException("Stop the session before deleting it");
    }
    await this.db
      .delete(executionSessions)
      .where(eq(executionSessions.id, row.id));
    return { ok: true as const };
  }

  private async requireSameBoard(
    tx: ExecutionDb,
    workspaceId: string,
    taskIds: string[],
  ) {
    const selected = await tx
      .select({ id: tasks.id, taskBoardId: tasks.taskBoardId })
      .from(tasks)
      .where(and(eq(tasks.workspaceId, workspaceId), inArray(tasks.id, taskIds)));
    if (selected.length !== taskIds.length) throw new NotFoundException("Task");
    const boards = new Set(selected.map((task) => task.taskBoardId));
    if (boards.size > 1) {
      throw new BadRequestException("Tasks must belong to the same board");
    }
  }

  private async sessionRow(
    db: ExecutionDb,
    workspaceId: string,
    sessionId: string,
  ) {
    const [row] = await db
      .select()
      .from(executionSessions)
      .where(
        and(
          eq(executionSessions.id, sessionId),
          eq(executionSessions.workspaceId, workspaceId),
        ),
      );
    if (!row) throw new NotFoundException("Execution session");
    return row;
  }

  private async restoreQueue(
    tx: ExecutionDb,
    workspaceId: string,
    taskIds: string[],
    now: Date,
  ) {
    if (taskIds.length === 0) return;
    const existing = await tx
      .select({ taskId: executionQueue.taskId })
      .from(executionQueue)
      .where(
        and(
          eq(executionQueue.workspaceId, workspaceId),
          inArray(executionQueue.taskId, taskIds),
        ),
      );
    const queued = new Set(existing.map((item) => item.taskId));
    const live = await tx
      .select({ id: tasks.id })
      .from(tasks)
      .where(and(eq(tasks.workspaceId, workspaceId), inArray(tasks.id, taskIds)));
    const liveIds = new Set(live.map((task) => task.id));
    const [highest] = await tx
      .select({ value: max(executionQueue.position) })
      .from(executionQueue)
      .where(eq(executionQueue.workspaceId, workspaceId));
    let position = (highest?.value ?? -1) + 1;
    for (const taskId of taskIds) {
      if (!liveIds.has(taskId) || queued.has(taskId)) continue;
      await tx.insert(executionQueue).values({
        id: randomUUID(),
        workspaceId,
        taskId,
        position,
        createdAt: now,
      });
      position += 1;
    }
  }

  private async requireTask(workspaceId: string, taskId: string) {
    const [task] = await this.db
      .select({ id: tasks.id })
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.workspaceId, workspaceId)));
    if (!task) throw new NotFoundException("Task");
  }

  private async openRow(db: ExecutionDb, workspaceId: string) {
    const [row] = await db
      .select()
      .from(executionSessions)
      .where(
        and(
          eq(executionSessions.workspaceId, workspaceId),
          isNull(executionSessions.endedAt),
        ),
      );
    return row ?? null;
  }

  private async sessionLinks(
    db: ExecutionDb,
    sessionId: string,
    activeOnly = false,
  ) {
    const links = await db
      .select()
      .from(executionSessionTasks)
      .where(eq(executionSessionTasks.sessionId, sessionId))
      .orderBy(asc(executionSessionTasks.position));
    return activeOnly ? links.filter((link) => link.active) : links;
  }

  private async closeTracking(
    db: ExecutionDb,
    links: ExecutionSessionTaskRow[],
    now: Date,
  ) {
    for (const link of links) {
      if (!hasOpenInterval(link.intervals ?? [])) continue;
      await db
        .update(executionSessionTasks)
        .set({ intervals: closeOpenIntervals(link.intervals ?? [], now) })
        .where(eq(executionSessionTasks.id, link.id));
    }
  }

  private async finishSession(
    db: ExecutionDb,
    row: ExecutionSessionRow,
    endedAt: Date,
  ) {
    const links = await this.sessionLinks(db, row.id);
    await this.closeTracking(db, links, endedAt);
    const closed = links.map((link) => ({
      ...link,
      intervals: closeOpenIntervals(link.intervals ?? [], endedAt),
    }));
    const duration = closed.reduce(
      (total, link) => total + sumIntervalSeconds(link.intervals, endedAt),
      0,
    );
    await db
      .update(executionSessions)
      .set({ endedAt, duration, updatedAt: endedAt })
      .where(eq(executionSessions.id, row.id));
  }

  private async queue(db: ExecutionDb, workspaceId: string) {
    const rows = await db
      .select({
        item: executionQueue,
        task: tasks,
        boardId: taskBoards.id,
        boardName: taskBoards.name,
        areaName: boardAreas.name,
        isDefaultArea: boardAreas.isDefault,
        stageName: boardProgressStages.name,
      })
      .from(executionQueue)
      .innerJoin(tasks, eq(executionQueue.taskId, tasks.id))
      .innerJoin(taskBoards, eq(tasks.taskBoardId, taskBoards.id))
      .innerJoin(boardAreas, eq(tasks.areaId, boardAreas.id))
      .leftJoin(
        boardProgressStages,
        eq(tasks.progressStageId, boardProgressStages.id),
      )
      .where(eq(executionQueue.workspaceId, workspaceId))
      .orderBy(asc(executionQueue.position));
    const actualTime = await this.actualTimeByTask(
      db,
      rows.map((row) => row.task.id),
    );
    return rows.map((row) =>
      mapExecutionQueueItem(
        row.item,
        queueTask(
          row.task,
          row.boardId,
          row.boardName,
          row.areaName,
          row.isDefaultArea,
          row.stageName,
          actualTime.get(row.task.id) ?? 0,
        ),
      ),
    );
  }

  private async taskDetails(
    db: ExecutionDb,
    workspaceId: string,
    links: ExecutionSessionTaskRow[],
  ) {
    const details: ExecutionCurrent[] = [];
    for (const link of links) {
      const detail = await this.taskDetail(
        db,
        workspaceId,
        link.taskId,
        link.intervals ?? [],
      );
      if (detail) details.push(detail);
    }
    return details;
  }

  async preview(workspaceId: string, taskIds: string[]) {
    const uniqueIds = [...new Set(taskIds)];
    if (uniqueIds.length !== taskIds.length) {
      throw new BadRequestException("Duplicate task");
    }
    const details: ExecutionCurrent[] = [];
    for (const taskId of taskIds) {
      const detail = await this.taskDetail(this.db, workspaceId, taskId, []);
      if (!detail) throw new NotFoundException("Task");
      details.push(detail);
    }
    return details;
  }

  async suggestions(workspaceId: string) {
    const [queued, open] = await Promise.all([
      this.db
        .select({ taskId: executionQueue.taskId })
        .from(executionQueue)
        .where(eq(executionQueue.workspaceId, workspaceId)),
      this.openRow(this.db, workspaceId),
    ]);
    const hidden = new Set(queued.map((item) => item.taskId));
    if (open) {
      const links = await this.sessionLinks(this.db, open.id, true);
      for (const link of links) hidden.add(link.taskId);
    }
    const rows = await this.db
      .select({
        id: tasks.id,
        taskKey: tasks.taskKey,
        summary: tasks.summary,
        priority: tasks.priority,
        estimation: tasks.estimation,
        scheduleDate: tasks.scheduleDate,
        dueDate: tasks.dueDate,
        boardId: taskBoards.id,
        boardName: taskBoards.name,
        areaName: boardAreas.name,
        isDefaultArea: boardAreas.isDefault,
        stageName: boardProgressStages.name,
      })
      .from(tasks)
      .innerJoin(taskBoards, eq(tasks.taskBoardId, taskBoards.id))
      .innerJoin(boardAreas, eq(tasks.areaId, boardAreas.id))
      .leftJoin(
        boardProgressStages,
        eq(tasks.progressStageId, boardProgressStages.id),
      )
      .where(
        and(
          eq(tasks.workspaceId, workspaceId),
          isNull(tasks.parentTaskId),
          inArray(tasks.status, ["todo", "in_progress"]),
        ),
      )
      .orderBy(desc(tasks.updatedAt))
      .limit(500);
    return rows.flatMap((row) => {
      if (hidden.has(row.id)) return [];
      return [
        {
          id: row.id,
          taskKey: row.taskKey,
          summary: row.summary,
          priority: row.priority,
          estimation: row.estimation,
          scheduleDate: toIso(row.scheduleDate),
          dueDate: toIso(row.dueDate),
          boardId: row.boardId,
          boardName: row.boardName,
          areaName: row.areaName,
          isDefaultArea: row.isDefaultArea,
          stageName: row.stageName,
        },
      ];
    });
  }

  private async taskDetail(
    db: ExecutionDb,
    workspaceId: string,
    taskId: string,
    intervals: ExecutionCurrent["intervals"],
  ): Promise<ExecutionCurrent | null> {
    const [row] = await db
      .select({
        task: tasks,
        boardId: taskBoards.id,
        boardName: taskBoards.name,
        areaName: boardAreas.name,
        isDefaultArea: boardAreas.isDefault,
        stageName: boardProgressStages.name,
      })
      .from(tasks)
      .innerJoin(taskBoards, eq(tasks.taskBoardId, taskBoards.id))
      .innerJoin(boardAreas, eq(tasks.areaId, boardAreas.id))
      .leftJoin(
        boardProgressStages,
        eq(tasks.progressStageId, boardProgressStages.id),
      )
      .where(
        and(eq(tasks.id, taskId), eq(tasks.workspaceId, workspaceId)),
      );
    if (!row) return null;
    const [subtasks, goal, actualTime] = await Promise.all([
      db
        .select({
          id: tasks.id,
          taskKey: tasks.taskKey,
          summary: tasks.summary,
          status: tasks.status,
        })
        .from(tasks)
        .where(
          and(
            eq(tasks.workspaceId, workspaceId),
            eq(tasks.parentTaskId, taskId),
          ),
        )
        .orderBy(asc(tasks.position)),
      db
        .select({ id: docs.id, title: docs.title })
        .from(docTasks)
        .innerJoin(docs, eq(docs.id, docTasks.docId))
        .where(and(eq(docTasks.taskId, taskId), eq(docs.type, DocType.GOAL)))
        .limit(1),
      this.actualTimeByTask(db, [taskId]),
    ]);
    return {
      ...queueTask(
        row.task,
        row.boardId,
        row.boardName,
        row.areaName,
        row.isDefaultArea,
        row.stageName,
        actualTime.get(taskId) ?? 0,
      ),
      description: row.task.description,
      acceptanceCriteria: row.task.acceptanceCriteria ?? [],
      intervals,
      goal: goal[0] ?? null,
      subtasks,
    };
  }

  private async actualTimeByTask(db: ExecutionDb, taskIds: string[]) {
    const totals = new Map<string, number>();
    if (taskIds.length === 0) return totals;
    const rows = await db
      .select({
        taskId: executionSessionTasks.taskId,
        intervals: executionSessionTasks.intervals,
      })
      .from(executionSessionTasks)
      .where(inArray(executionSessionTasks.taskId, taskIds));
    const now = new Date();
    for (const row of rows) {
      totals.set(
        row.taskId,
        (totals.get(row.taskId) ?? 0) +
          sumIntervalSeconds(row.intervals ?? [], now),
      );
    }
    return totals;
  }
}

function queueTask(
  task: TaskRow,
  boardId: string,
  boardName: string,
  areaName: string,
  isDefaultArea: boolean,
  stageName: string | null,
  actualTime: number,
): ExecutionQueueTask {
  return {
    id: task.id,
    taskKey: task.taskKey,
    summary: task.summary,
    status: task.status,
    priority: task.priority,
    estimation: task.estimation,
    actualTime,
    scheduleDate: toIso(task.scheduleDate),
    dueDate: toIso(task.dueDate),
    boardId,
    boardName,
    areaName,
    isDefaultArea,
    stageName,
  };
}

function taskRefs(
  links: ExecutionSessionTaskRow[],
  details: ExecutionCurrent[],
): ExecutionTaskRef[] {
  return links.flatMap((link) => {
    const task = details.find((detail) => detail.id === link.taskId);
    if (!task) return [];
    return [{ id: task.id, taskKey: task.taskKey, summary: task.summary }];
  });
}

function focusedTask(links: ExecutionSessionTaskRow[]) {
  let latest: { taskId: string; startedAt: string } | null = null;
  for (const link of links) {
    for (const interval of link.intervals ?? []) {
      if (interval.endedAt == null) return link.taskId;
      if (!latest || interval.startedAt > latest.startedAt) {
        latest = { taskId: link.taskId, startedAt: interval.startedAt };
      }
    }
  }
  return latest?.taskId ?? links[0]?.taskId ?? null;
}

function sameTaskIds(queuedIds: string[], taskIds: string[]) {
  if (queuedIds.length !== taskIds.length) return false;
  if (new Set(taskIds).size !== taskIds.length) return false;
  const queued = new Set(queuedIds);
  return taskIds.every((taskId) => queued.has(taskId));
}

type ExecutionDb = Pick<NodePgDatabase, "select" | "insert" | "update" | "delete">;
