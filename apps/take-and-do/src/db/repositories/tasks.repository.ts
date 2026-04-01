import { eq, and, isNull, inArray, gte, lt } from "drizzle-orm";

import type { DataAccess } from "@/db/repositories/base.repository";
import { DB } from "@/db/client";
import { tasks } from "@/db/schemas/task.schema";
import { labelsTable } from "@/db/schemas/label.schema";
import { TaskPriority, TaskStatus } from "@/types/task";
import { TaskBoardsRepository } from "./task-boards.repository";
import { BaseRepository } from "@/db/repositories/base.repository";
import { tasksHelper } from "@/helpers/task.helper";
import {
  assignSubtaskIdsAndKeys,
  boardNameToTaskKeyPrefix,
  deriveTaskKeyPrefix,
  extractNumericPortion,
} from "@/helpers/task-key.helper";
import { genericHelper } from "@/helpers/generic.helper";
import type { Task, TaskUpdate } from "@/types/task";

export class TasksRepository extends BaseRepository {
  constructor(
    db: DB,
    private readonly taskBoardsRepository: TaskBoardsRepository,
  ) {
    super(db);
  }

  async getAllTasks(access: DataAccess): Promise<Task[]> {
    return this.loadAllTasksWithRelations(access);
  }

  async getTasksByTaskBoardId(
    taskBoardId: string,
    access: DataAccess,
  ): Promise<Task[]> {
    return this.loadAllTasksWithRelations(access, { taskBoardId });
  }

  async getTasksByDate(date: Date, access: DataAccess): Promise<Task[]> {
    return this.loadAllTasksWithRelations(access, { date });
  }

  async getTaskById(taskId: string, access: DataAccess): Promise<Task | null> {
    const accessCond = this.accessWhere(tasks, access);
    const taskRows = await this.db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), accessCond));

    if (taskRows.length === 0) return null;

    const taskRow = taskRows[0];
    const allTaskRows = await this.db
      .select()
      .from(tasks)
      .where(and(eq(tasks.taskBoardId, taskRow.taskBoardId), accessCond));

    return this.convertTaskRowToTask(taskRow, allTaskRows);
  }

  async getTaskByKey(
    taskKey: string,
    access: DataAccess,
  ): Promise<{ task: Task; parent: Task | null } | null> {
    const accessCond = this.accessWhere(tasks, access);
    const taskRows = await this.db
      .select()
      .from(tasks)
      .where(and(eq(tasks.taskKey, taskKey), accessCond));

    if (taskRows.length === 0) return null;

    const taskRow = taskRows[0];
    let parent: Task | null = null;

    if (taskRow.parentTaskId) {
      const parentRows = await this.db
        .select()
        .from(tasks)
        .where(and(eq(tasks.id, taskRow.parentTaskId), accessCond));

      if (parentRows.length > 0) {
        const allTaskRowsForParent = await this.db
          .select()
          .from(tasks)
          .where(and(eq(tasks.taskBoardId, taskRow.taskBoardId), accessCond));
        parent = await this.convertTaskRowToTask(
          parentRows[0],
          allTaskRowsForParent,
        );
      }
    }

    const allTaskRows = await this.db
      .select()
      .from(tasks)
      .where(and(eq(tasks.taskBoardId, taskRow.taskBoardId), accessCond));

    return {
      task: await this.convertTaskRowToTask(taskRow, allTaskRows),
      parent,
    };
  }

  async createTask(
    taskData: Omit<Task, "id">,
    access: DataAccess,
    options?: { taskBoardName?: string },
  ): Promise<Task> {
    if (!taskData.taskBoardId) throw new Error("Task must have a taskBoardId");

    if (access.isAnonymous)
      return this.createTaskInMemoryWithoutDatabase(taskData, access, options);

    const board = await this.taskBoardsRepository.getTaskBoardById(
      taskData.taskBoardId,
      access,
    );
    if (!board) throw new Error("Task board not found");

    const taskId = genericHelper.generateId();
    let taskKey = taskData.taskKey;
    if (!taskKey)
      taskKey = await this.generateNextTaskKeyForBoard(
        taskData.taskBoardId,
        access,
      );

    await this.db.insert(tasks).values({
      id: taskId,
      userId: access.userId,
      isPublic: false,
      taskBoardId: taskData.taskBoardId,
      taskKey,
      summary: taskData.summary,
      description: taskData.description || "",
      status: taskData.status,
      priority: taskData.priority,
      dueDate: taskData.dueDate || null,
      estimation: taskData.estimation || null,
      scheduleDate: taskData.scheduleDate || null,
      parentTaskId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    if (taskData.subtasks?.length) {
      const processedSubtasks = await this.processSubtasks(
        taskData.taskBoardId,
        taskId,
        taskKey,
        taskData.subtasks,
        access,
      );

      for (
        let subtaskIndex = 0;
        subtaskIndex < taskData.subtasks.length;
        subtaskIndex++
      ) {
        const subtask = taskData.subtasks[subtaskIndex];
        const processed = processedSubtasks[subtaskIndex];
        await this.db.insert(tasks).values({
          id: processed.id,
          userId: access.userId,
          isPublic: false,
          taskBoardId: subtask.taskBoardId || taskData.taskBoardId,
          taskKey: processed.taskKey,
          summary: subtask.summary,
          description: subtask.description || "",
          status: subtask.status,
          priority: subtask.priority,
          dueDate: subtask.dueDate || null,
          estimation: subtask.estimation || null,
          scheduleDate: subtask.scheduleDate || null,
          parentTaskId: taskId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        if (subtask.labels?.length)
          await this.syncTaskLabels(processed.id, subtask.labels);
      }
    }

    if (taskData.labels?.length)
      await this.syncTaskLabels(taskId, taskData.labels);

    const created = await this.getTaskById(taskId, access);
    if (!created) throw new Error("Failed to retrieve created task");
    return created;
  }

  async updateTask(
    taskId: string,
    updates: TaskUpdate,
    access: DataAccess,
  ): Promise<Task | null> {
    const accessCond = this.accessWhere(tasks, access);
    const existingRows = await this.db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), accessCond));

    if (existingRows.length === 0) return null;

    const existing = existingRows[0];
    const boardChanged =
      updates.taskBoardId !== undefined &&
      updates.taskBoardId !== existing.taskBoardId;

    if (boardChanged && updates.taskBoardId) {
      const newBoard = await this.taskBoardsRepository.getTaskBoardById(
        updates.taskBoardId,
        access,
      );
      if (!newBoard) return null;
    }

    let parentKeyForSubtasks = existing.taskKey ?? null;
    const updateData: Partial<typeof tasks.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (updates.summary !== undefined) updateData.summary = updates.summary;
    if (updates.description !== undefined)
      updateData.description = updates.description;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.dueDate !== undefined)
      updateData.dueDate = updates.dueDate ?? null;
    if (updates.estimation !== undefined)
      updateData.estimation = updates.estimation ?? null;
    if (updates.scheduleDate !== undefined)
      updateData.scheduleDate = updates.scheduleDate ?? null;
    if (updates.taskBoardId !== undefined)
      updateData.taskBoardId = updates.taskBoardId;
    if (updates.isPublic !== undefined) updateData.isPublic = updates.isPublic;

    if (boardChanged && existing.parentTaskId == null) {
      const nextKey = await this.generateNextTaskKeyForBoard(
        updates.taskBoardId!,
        access,
      );
      updateData.taskKey = nextKey;
      parentKeyForSubtasks = nextKey;
    }

    const resolvedBoardId =
      updates.taskBoardId !== undefined
        ? updates.taskBoardId
        : existing.taskBoardId;

    await this.db.update(tasks).set(updateData).where(eq(tasks.id, taskId));

    if (
      boardChanged &&
      existing.parentTaskId == null &&
      updates.subtasks === undefined
    ) {
      await this.rekeySubtasksAfterParentBoardMove(
        taskId,
        updates.taskBoardId!,
        access,
      );
    }

    if (updates.subtasks !== undefined) {
      await this.db.delete(tasks).where(eq(tasks.parentTaskId, taskId));

      if (updates.subtasks.length > 0) {
        const processedSubtasks = await this.processSubtasks(
          resolvedBoardId,
          taskId,
          parentKeyForSubtasks,
          updates.subtasks,
          access,
        );

        for (
          let subtaskIndex = 0;
          subtaskIndex < updates.subtasks.length;
          subtaskIndex++
        ) {
          const subtask = updates.subtasks[subtaskIndex];
          const processed = processedSubtasks[subtaskIndex];
          await this.db.insert(tasks).values({
            id: processed.id,
            userId: access.userId,
            isPublic: false,
            taskBoardId: subtask.taskBoardId || resolvedBoardId,
            taskKey: processed.taskKey,
            summary: subtask.summary,
            description: subtask.description || "",
            status: subtask.status,
            priority: subtask.priority,
            dueDate: subtask.dueDate || null,
            estimation: subtask.estimation || null,
            scheduleDate: subtask.scheduleDate || null,
            parentTaskId: taskId,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          if (subtask.labels?.length)
            await this.syncTaskLabels(processed.id, subtask.labels);
        }
      }
    }

    if (updates.labels !== undefined)
      await this.syncTaskLabels(taskId, updates.labels);

    return this.getTaskById(taskId, access);
  }

  async deleteTask(taskId: string, access: DataAccess): Promise<void> {
    const existing = await this.getTaskById(taskId, access);
    if (!existing) return;
    await this.db.delete(tasks).where(eq(tasks.id, taskId));
  }

  async deleteAllTasksForTaskBoard(
    taskBoardId: string,
    access: DataAccess,
  ): Promise<number> {
    const accessCond = this.accessWhere(tasks, access);
    const rows = await this.db
      .select({ id: tasks.id })
      .from(tasks)
      .where(and(eq(tasks.taskBoardId, taskBoardId), accessCond));
    if (rows.length === 0) return 0;
    await this.db
      .delete(tasks)
      .where(and(eq(tasks.taskBoardId, taskBoardId), accessCond));
    return rows.length;
  }

  async getTasksForOptimization(
    taskIds: string[],
    access: DataAccess,
  ): Promise<TaskForOptimization[]> {
    if (taskIds.length === 0) return [];
    const accessCond = this.accessWhere(tasks, access);
    const rows = await this.db
      .select({
        id: tasks.id,
        summary: tasks.summary,
        priority: tasks.priority,
        dueDate: tasks.dueDate,
        estimation: tasks.estimation,
        scheduleDate: tasks.scheduleDate,
        status: tasks.status,
      })
      .from(tasks)
      .where(and(inArray(tasks.id, taskIds), accessCond));

    return rows.map((row) => ({
      id: row.id,
      summary: row.summary,
      priority: row.priority,
      dueDate: row.dueDate,
      estimation: row.estimation,
      scheduleDate: row.scheduleDate,
      status: row.status,
    }));
  }

  async getTaskStatistics(
    timeframe: "week" | "month" | "quarter" | "all" = "month",
    access: DataAccess,
  ): Promise<TaskStatistics> {
    const now = new Date();
    let startDate: Date | null = null;

    switch (timeframe) {
      case "week":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "quarter":
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 3);
        break;
    }

    const accessCond = this.accessWhere(tasks, access);
    const query = this.db
      .select({
        id: tasks.id,
        status: tasks.status,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        dueDate: tasks.dueDate,
      })
      .from(tasks);

    const allTasks = startDate
      ? await query.where(and(gte(tasks.createdAt, startDate), accessCond))
      : await query.where(accessCond);

    const completedTasks = allTasks.filter((t) => t.status === "Done");
    let avgCompletionTimeDays = 0;

    if (completedTasks.length > 0) {
      const completionTimes = completedTasks
        .map(
          (task) =>
            (new Date(task.updatedAt).getTime() -
              new Date(task.createdAt).getTime()) /
            (1000 * 60 * 60 * 24),
        )
        .filter((days) => days >= 0);
      if (completionTimes.length > 0) {
        avgCompletionTimeDays =
          completionTimes.reduce((sum, days) => sum + days, 0) /
          completionTimes.length;
      }
    }

    const tasksWithDueDate = allTasks.filter((t) => t.dueDate !== null);
    const overdueTasks = tasksWithDueDate.filter((t) => {
      if (t.status === "Done") return false;
      const dueDate = tasksHelper.date.parse(t.dueDate);
      return dueDate !== undefined && dueDate < now;
    });

    return {
      tasksCreated: allTasks.length,
      tasksCompleted: completedTasks.length,
      avgCompletionTimeDays: Math.round(avgCompletionTimeDays * 10) / 10,
      overdueRate:
        tasksWithDueDate.length > 0
          ? Math.round((overdueTasks.length / tasksWithDueDate.length) * 100) /
            100
          : 0,
    };
  }

  async getTaskCounts(
    timeframe: "all" | "week" | "month" | "quarter",
    access: DataAccess,
  ): Promise<TaskCounts> {
    const accessCond = this.accessWhere(tasks, access);
    const conditions = [accessCond];

    if (timeframe !== "all") {
      const startDate = new Date();
      switch (timeframe) {
        case "week":
          startDate.setDate(startDate.getDate() - 7);
          break;
        case "month":
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case "quarter":
          startDate.setMonth(startDate.getMonth() - 3);
          break;
      }
      conditions.push(gte(tasks.createdAt, startDate));
    }

    const now = new Date();
    const rows = await this.db
      .select({
        status: tasks.status,
        priority: tasks.priority,
        dueDate: tasks.dueDate,
      })
      .from(tasks)
      .where(and(...conditions));

    return {
      total: rows.length,
      todo: rows.filter((row) => row.status === TaskStatus.TODO).length,
      inProgress: rows.filter((row) => row.status === TaskStatus.IN_PROGRESS)
        .length,
      done: rows.filter((row) => row.status === TaskStatus.DONE).length,
      highPriority: rows.filter((row) => row.priority === TaskPriority.HIGH)
        .length,
      overdue: rows.filter((row) => {
        const due = tasksHelper.date.parse(row.dueDate);
        return due !== undefined && due < now && row.status !== TaskStatus.DONE;
      }).length,
    };
  }

  async getMaxNumericAmongDirectSubtasks(
    parentTaskId: string,
    access: DataAccess,
  ): Promise<number> {
    const accessCond = this.accessWhere(tasks, access);
    const rows = await this.db
      .select({ taskKey: tasks.taskKey })
      .from(tasks)
      .where(and(eq(tasks.parentTaskId, parentTaskId), accessCond));

    let max = 0;
    for (const row of rows) {
      if (!row.taskKey) continue;
      const n = extractNumericPortion(row.taskKey);
      if (n !== null) max = Math.max(max, n);
    }
    return max;
  }

  async getMaxNumericSuffixForBoard(
    taskBoardId: string,
    boardPrefix: string,
    access: DataAccess,
  ): Promise<number> {
    const rows = await this.db
      .select({ taskKey: tasks.taskKey })
      .from(tasks)
      .where(
        and(
          eq(tasks.taskBoardId, taskBoardId),
          this.accessWhere(tasks, access),
        ),
      );

    let max = 0;
    for (const row of rows) {
      if (!row.taskKey) continue;
      if (deriveTaskKeyPrefix(row.taskKey) !== boardPrefix) continue;
      const n = extractNumericPortion(row.taskKey);
      if (n !== null) max = Math.max(max, n);
    }
    return max;
  }

  async generateNextTaskKeyForBoard(
    taskBoardId: string,
    access: DataAccess,
  ): Promise<string> {
    const board = await this.taskBoardsRepository.getTaskBoardById(
      taskBoardId,
      access,
    );
    const prefix = boardNameToTaskKeyPrefix(board ?? null);
    const maxNum = await this.getMaxNumericSuffixForBoard(
      taskBoardId,
      prefix,
      access,
    );
    return `${prefix}-${maxNum + 1}`;
  }

  async rekeySubtasksAfterParentBoardMove(
    parentTaskId: string,
    newTaskBoardId: string,
    access: DataAccess,
  ): Promise<void> {
    const subtaskRows = await this.db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.parentTaskId, parentTaskId),
          this.accessWhere(tasks, access),
        ),
      );

    const sorted = [...subtaskRows].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );

    const board = await this.taskBoardsRepository.getTaskBoardById(
      newTaskBoardId,
      access,
    );
    const prefix = boardNameToTaskKeyPrefix(board ?? null);
    let nextNum = await this.getMaxNumericSuffixForBoard(
      newTaskBoardId,
      prefix,
      access,
    );
    const now = new Date();
    for (const row of sorted) {
      nextNum += 1;
      const nextKey = `${prefix}-${nextNum}`;
      await this.db
        .update(tasks)
        .set({ taskKey: nextKey, taskBoardId: newTaskBoardId, updatedAt: now })
        .where(eq(tasks.id, row.id));
    }
  }

  async convertTaskRowToTask(
    taskRow: typeof tasks.$inferSelect,
    allTasks: Array<typeof tasks.$inferSelect>,
  ): Promise<Task> {
    const subtaskRows = allTasks.filter((t) => t.parentTaskId === taskRow.id);
    const subtasks = await Promise.all(
      subtaskRows.map((subtaskRow) =>
        this.convertTaskRowToTask(subtaskRow, allTasks),
      ),
    );

    return {
      id: taskRow.id,
      taskBoardId: taskRow.taskBoardId,
      taskKey: taskRow.taskKey || undefined,
      summary: taskRow.summary,
      description: taskRow.description,
      status: taskRow.status as TaskStatus,
      priority: taskRow.priority as TaskPriority,
      dueDate: tasksHelper.date.parse(taskRow.dueDate),
      estimation: taskRow.estimation || undefined,
      subtasks: subtasks.length > 0 ? subtasks : undefined,
      scheduleDate: tasksHelper.date.parse(taskRow.scheduleDate),
    };
  }

  async loadAllTasksWithRelations(
    access: DataAccess,
    filter?: {
      taskBoardId?: string;
      date?: Date;
      parentTaskId?: string | null;
    },
  ): Promise<Task[]> {
    const accessCond = this.accessWhere(tasks, access);
    let allTaskRows: Array<typeof tasks.$inferSelect> = [];

    if (filter?.date) {
      const targetDate = new Date(filter.date);
      targetDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      const scheduledTopLevelTasks = await this.db
        .select()
        .from(tasks)
        .where(
          and(
            accessCond,
            isNull(tasks.parentTaskId),
            gte(tasks.scheduleDate, targetDate),
            lt(tasks.scheduleDate, nextDay),
          ),
        );

      if (scheduledTopLevelTasks.length === 0) return [];

      const taskBoardIds = [
        ...new Set(scheduledTopLevelTasks.map((t: TaskRow) => t.taskBoardId)),
      ];
      const boardConditions = [
        accessCond,
        inArray(tasks.taskBoardId, taskBoardIds as string[]),
      ];
      if (filter?.taskBoardId)
        boardConditions.push(eq(tasks.taskBoardId, filter.taskBoardId));

      const allBoardTasks = await this.db
        .select()
        .from(tasks)
        .where(and(...boardConditions));

      type TaskRow = typeof tasks.$inferSelect;
      const findDescendantIds = (
        parentId: string,
        taskList: TaskRow[],
      ): Set<string> => {
        const descendants = new Set<string>([parentId]);
        const directChildren = taskList.filter(
          (t: TaskRow) => t.parentTaskId === parentId,
        );
        for (const child of directChildren) {
          findDescendantIds(child.id, taskList).forEach((id) =>
            descendants.add(id),
          );
        }
        return descendants;
      };

      const taskIdsToInclude = new Set<string>();
      for (const scheduledTask of scheduledTopLevelTasks) {
        findDescendantIds(scheduledTask.id, allBoardTasks).forEach((id) =>
          taskIdsToInclude.add(id),
        );
      }
      allTaskRows = allBoardTasks.filter((task: TaskRow) =>
        taskIdsToInclude.has(task.id),
      );
    } else {
      const conditions = [accessCond];
      if (filter?.taskBoardId)
        conditions.push(eq(tasks.taskBoardId, filter.taskBoardId));
      if (filter?.parentTaskId !== undefined) {
        conditions.push(
          filter.parentTaskId === null
            ? isNull(tasks.parentTaskId)
            : eq(tasks.parentTaskId, filter.parentTaskId),
        );
      }
      allTaskRows = await this.db
        .select()
        .from(tasks)
        .where(and(...conditions));
    }

    const topLevelTasks = allTaskRows.filter((t) => !t.parentTaskId);
    return Promise.all(
      topLevelTasks.map((taskRow) =>
        this.convertTaskRowToTask(taskRow, allTaskRows),
      ),
    );
  }

  async syncTaskLabels(_taskId: string, labelNames: string[]): Promise<void> {
    for (const rawName of labelNames) {
      const name = rawName.trim();
      if (!name) continue;
      const existing = await this.db
        .select()
        .from(labelsTable)
        .where(eq(labelsTable.name, name));
      if (existing.length > 0) continue;
      await this.db.insert(labelsTable).values({
        id: genericHelper.generateId(),
        name,
        createdAt: new Date(),
      });
    }
  }

  async processSubtasks(
    taskBoardId: string,
    parentTaskId: string,
    parentTaskKey: string | null | undefined,
    subtasks: Task[],
    access: DataAccess,
  ): Promise<Array<{ id: string; taskKey: string }>> {
    const board = await this.taskBoardsRepository.getTaskBoardById(
      taskBoardId,
      access,
    );
    const accessCond = this.accessWhere(tasks, access);

    const existingSubtasks = await this.db
      .select()
      .from(tasks)
      .where(and(eq(tasks.parentTaskId, parentTaskId), accessCond));

    const existingSubtasksMap = new Map(
      existingSubtasks.map((st) => [st.id, st]),
    );
    const trimmedParentKey = parentTaskKey?.trim();
    let prefix: string;
    let initialNextNum: number;

    if (trimmedParentKey) {
      prefix = deriveTaskKeyPrefix(trimmedParentKey);
      initialNextNum = Math.max(
        extractNumericPortion(trimmedParentKey) ?? 0,
        await this.getMaxNumericAmongDirectSubtasks(parentTaskId, access),
      );
    } else {
      prefix = boardNameToTaskKeyPrefix(board ?? null);
      initialNextNum = await this.getMaxNumericSuffixForBoard(
        taskBoardId,
        prefix,
        access,
      );
    }

    return assignSubtaskIdsAndKeys(
      subtasks,
      prefix,
      initialNextNum,
      (subtaskId) => existingSubtasksMap.get(subtaskId)?.taskKey,
    );
  }

  async createTaskInMemoryWithoutDatabase(
    taskData: Omit<Task, "id">,
    access: DataAccess,
    options?: { taskBoardName?: string },
  ): Promise<Task> {
    if (!access.isAnonymous)
      throw new Error("createTaskInMemoryWithoutDatabase: anonymous only");
    if (!taskData.taskBoardId?.trim())
      throw new Error("Task must have a taskBoardId");

    const taskId = genericHelper.generateId();
    const boardForPrefix = options?.taskBoardName?.trim()
      ? { name: options.taskBoardName.trim() }
      : null;
    const boardPrefix = boardNameToTaskKeyPrefix(boardForPrefix);
    let taskKey = taskData.taskKey?.trim();
    if (!taskKey)
      taskKey = `${boardPrefix}-${genericHelper.generateId().slice(0, 10)}`;

    const baseTask: Task = {
      id: taskId,
      taskBoardId: taskData.taskBoardId,
      taskKey,
      summary: taskData.summary,
      description: taskData.description || "",
      status: taskData.status,
      priority: taskData.priority,
      dueDate: taskData.dueDate,
      estimation: taskData.estimation,
      scheduleDate: taskData.scheduleDate,
      labels: taskData.labels,
    };

    if (!taskData.subtasks?.length) return baseTask;

    const subtaskPrefix = deriveTaskKeyPrefix(taskKey);
    const parentNumeric = extractNumericPortion(taskKey) ?? 0;
    const processedSubtasks = assignSubtaskIdsAndKeys(
      taskData.subtasks,
      subtaskPrefix,
      parentNumeric,
      () => undefined,
    );

    return {
      ...baseTask,
      subtasks: taskData.subtasks.map((subtask, index) => {
        const processed = processedSubtasks[index];
        return {
          id: processed.id,
          taskBoardId: subtask.taskBoardId || taskData.taskBoardId,
          taskKey: processed.taskKey,
          summary: subtask.summary,
          description: subtask.description || "",
          status: subtask.status,
          priority: subtask.priority,
          dueDate: subtask.dueDate,
          estimation: subtask.estimation,
          scheduleDate: subtask.scheduleDate,
          labels: subtask.labels,
        };
      }),
    };
  }
}

export interface TaskStatistics {
  tasksCreated: number;
  tasksCompleted: number;
  avgCompletionTimeDays: number;
  overdueRate: number;
}

export interface TaskForOptimization {
  id: string;
  summary: string;
  priority: string;
  dueDate: Date | null;
  estimation: number | null;
  scheduleDate: Date | null;
  status: string;
}

export interface TaskCounts {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
  highPriority: number;
  overdue: number;
}
