import { aiServices } from "@/server/services/ai";
import { tasksHelper } from "@/helpers/task.helper";
import {
  BaseApiService,
  DataAccess,
} from "@/server/services/api/base.api.service";

import type { TaskPostPayload } from "@/helpers/task.helper";
import type { ComposeTaskOutput } from "@/server/services/ai";
import { Task, TaskPriority, TaskStatus, TaskUpdate } from "@/types/task";
import { DB, lt, gte, isNull, and, eq, inArray, asc } from "@/db/client";
import { labelsTable, taskLabelsTable, tasks } from "@/db/schemas";
import { TaskBoardsApiService } from "./task-boards.api.service";
import { LabelsApiService } from "./labels.api.service";
import {
  assignSubtaskIdsAndKeys,
  boardNameToTaskKeyPrefix,
  deriveTaskKeyPrefix,
  extractNumericPortion,
} from "@/helpers/task-key.helper";
import { genericHelper } from "@/helpers/generic.helper";

export class TasksApiService extends BaseApiService {
  constructor(
    protected readonly db: DB,
    private readonly taskBoardsService: TaskBoardsApiService,
    private readonly labelsService: LabelsApiService,
  ) {
    super(db);
  }

  async getAll(access: DataAccess) {
    return this.handleOperation(async () => {
      return this.loadAllTasksWithRelations(access);
    });
  }

  async getByBoardId(taskBoardId: string, access: DataAccess) {
    return this.handleOperation(async () => {
      return this.loadAllTasksWithRelations(access, { taskBoardId });
    });
  }

  async getByDate(date: Date, access: DataAccess) {
    return this.handleOperation(async () => {
      return this.loadAllTasksWithRelations(access, { date });
    });
  }

  async getById(taskId: string, access: DataAccess) {
    return this.handleOperation(async () => {
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

      const labelsByTaskId = await this.loadLabelNamesByTaskIds(
        allTaskRows.map((row) => row.id),
      );

      const task = await this.convertTaskRowToTask(
        taskRow,
        allTaskRows,
        labelsByTaskId,
      );
      if (!task) return null;
      return serializeTask(task);
    });
  }

  async convertTaskRowToTask(
    taskRow: typeof tasks.$inferSelect,
    allTasks: Array<typeof tasks.$inferSelect>,
    labelsByTaskId: Map<string, string[]>,
  ): Promise<Task> {
    const subtaskRows = allTasks.filter((t) => t.parentTaskId === taskRow.id);
    const subtasks = await Promise.all(
      subtaskRows.map((subtaskRow) =>
        this.convertTaskRowToTask(subtaskRow, allTasks, labelsByTaskId),
      ),
    );

    const labelNames = labelsByTaskId.get(taskRow.id);

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
      labels: labelNames && labelNames.length > 0 ? labelNames : undefined,
    };
  }

  async getByKey(taskKey: string, access: DataAccess) {
    return this.handleOperation(async () => {
      const accessCond = this.accessWhere(tasks, access);
      const taskRows = await this.db
        .select()
        .from(tasks)
        .where(and(eq(tasks.taskKey, taskKey), accessCond));

      if (taskRows.length === 0) return null;

      const taskRow = taskRows[0];
      let parent: Task | null = null;

      const allTaskRows = await this.db
        .select()
        .from(tasks)
        .where(and(eq(tasks.taskBoardId, taskRow.taskBoardId), accessCond));

      const labelsByTaskId = await this.loadLabelNamesByTaskIds(
        allTaskRows.map((row) => row.id),
      );

      if (taskRow.parentTaskId) {
        const parentRows = await this.db
          .select()
          .from(tasks)
          .where(and(eq(tasks.id, taskRow.parentTaskId), accessCond));

        if (parentRows.length > 0) {
          parent = await this.convertTaskRowToTask(
            parentRows[0],
            allTaskRows,
            labelsByTaskId,
          );
        }
      }

      const result = {
        task: await this.convertTaskRowToTask(
          taskRow,
          allTaskRows,
          labelsByTaskId,
        ),
        parent,
      };

      if (!result) return null;
      return {
        task: serializeTask(result.task),
        parent: result.parent ? serializeTask(result.parent) : null,
      };
    });
  }

  async createGuestTask(
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

  async generateNextTaskKeyForBoard(
    taskBoardId: string,
    access: DataAccess,
  ): Promise<string> {
    const board = await this.taskBoardsService.getById(taskBoardId, access);
    const prefix = boardNameToTaskKeyPrefix(board ?? undefined);
    const maxNum = await this.getMaxNumericSuffixForBoard(
      taskBoardId,
      prefix,
      access,
    );
    return `${prefix}-${maxNum + 1}`;
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

  private async createTask(
    taskData: Omit<Task, "id">,
    access: DataAccess,
    options?: { taskBoardName?: string },
  ): Promise<SerializedTask | Task> {
    return this.handleOperation(async () => {
      if (!taskData.taskBoardId)
        throw new Error("Task must have a taskBoardId");

      if (access.isAnonymous) {
        return this.createGuestTask(taskData, access, options);
      }

      const board = await this.taskBoardsService.getById(
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
            await this.syncTaskLabels(processed.id, subtask.labels, access);
        }
      }

      if (taskData.labels?.length)
        await this.syncTaskLabels(taskId, taskData.labels, access);

      const created = await this.getById(taskId, access);
      if (!created) throw new Error("Failed to retrieve created task");
      return created;
    });
  }

  async create(
    payload: TaskPostPayload,
    access: DataAccess,
  ): Promise<{ task?: SerializedTask | Task; composed?: ComposeTaskOutput }> {
    return this.handleOperation(async () => {
      if (payload.shouldUseAI && payload.text) {
        const composed = await aiServices.task.compose({ text: payload.text });

        if (payload._composeOnly) return { composed };

        const taskData = tasksHelper.fromJson.createTask({
          ...payload.task,
          summary: composed.summary,
          description: composed.description ?? payload.task.description,
          subtasks: composed.subtasks ?? payload.task.subtasks,
          priority: composed.priority ?? payload.task.priority,
          estimation: composed.estimation ?? payload.task.estimation,
          labels: composed.labels ?? payload.task.labels,
        });

        const task = await this.createTask(taskData, access, {
          taskBoardName: payload.taskBoardName,
        });
        return { task };
      }

      const task = await this.createTask(payload.task, access, {
        taskBoardName: payload.taskBoardName,
      });
      return { task };
    });
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

    const board = await this.taskBoardsService.getById(newTaskBoardId, access);
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

  async processSubtasks(
    taskBoardId: string,
    parentTaskId: string,
    parentTaskKey: string | null | undefined,
    subtasks: Task[],
    access: DataAccess,
  ): Promise<Array<{ id: string; taskKey: string }>> {
    const board = await this.taskBoardsService.getById(taskBoardId, access);
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

  async syncTaskLabels(
    taskId: string,
    labelNames: string[],
    access: DataAccess,
  ): Promise<void> {
    await this.db
      .delete(taskLabelsTable)
      .where(eq(taskLabelsTable.taskId, taskId));

    if (labelNames.length === 0) return;

    const labelIds = await this.labelsService.getOrCreateLabelIdsByNames(
      access.userId,
      labelNames,
    );

    let position = 0;
    for (const labelId of labelIds) {
      await this.db.insert(taskLabelsTable).values({
        taskId,
        labelId,
        position: position++,
      });
    }
  }

  async update(taskId: string, updates: TaskUpdate, access: DataAccess) {
    return this.handleOperation(async () => {
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
        const newBoard = await this.taskBoardsService.getById(
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
      if (updates.priority !== undefined)
        updateData.priority = updates.priority;
      if (updates.dueDate !== undefined)
        updateData.dueDate = updates.dueDate ?? null;
      if (updates.estimation !== undefined)
        updateData.estimation = updates.estimation ?? null;
      if (updates.scheduleDate !== undefined)
        updateData.scheduleDate = updates.scheduleDate ?? null;
      if (updates.taskBoardId !== undefined)
        updateData.taskBoardId = updates.taskBoardId;
      if (updates.isPublic !== undefined)
        updateData.isPublic = updates.isPublic;

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
              await this.syncTaskLabels(processed.id, subtask.labels, access);
          }
        }
      }

      if (updates.labels !== undefined) {
        await this.syncTaskLabels(taskId, updates.labels, access);
      }

      return await this.getById(taskId, access);
    });
  }

  async createSubtask(
    parentTaskId: string,
    body: {
      summary: string;
      description?: string;
      status?: TaskStatus;
      priority?: TaskPriority;
    },
    access: DataAccess,
  ) {
    return this.handleOperation(async () => {
      const parent = await this.getById(parentTaskId, access);
      if (!parent) return null;

      const mergedSubtasks: Task[] = [
        ...((parent.subtasks ?? []) as Task[]),
        {
          taskBoardId: parent.taskBoardId,
          summary: body.summary.trim(),
          description: body.description ?? "",
          status: body.status ?? TaskStatus.TODO,
          priority: body.priority ?? TaskPriority.MEDIUM,
          subtasks: [],
        } as unknown as Task,
      ];

      return this.update(parentTaskId, { subtasks: mergedSubtasks }, access);
    });
  }

  async delete(taskId: string, access: DataAccess): Promise<void> {
    return this.handleOperation(async () => {
      const existing = await this.getById(taskId, access);
      if (!existing) return;
      await this.db.delete(tasks).where(eq(tasks.id, taskId));
    });
  }

  async deleteAllForBoard(taskBoardId: string, access: DataAccess) {
    return this.handleOperation(async () => {
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
    });
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

  async optimize(taskIds: string[], access: DataAccess) {
    return this.handleOperation(async () => {
      const taskRows = await this.getTasksForOptimization(taskIds, access);

      const optimization = await aiServices.schedule.optimize({
        tasks: taskRows.map((row) => ({
          id: row.id,
          summary: row.summary,
          priority: row.priority as "low" | "medium" | "high" | "critical",
          dueDate: row.dueDate ? row.dueDate.toISOString() : null,
          estimation: row.estimation,
          scheduleDate: row.scheduleDate
            ? row.scheduleDate.toISOString()
            : null,
          status: row.status,
        })),
        currentDate: new Date().toISOString(),
      });

      return { optimization, tasksCount: taskRows.length };
    });
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

  protected override mapError(error: unknown): never {
    const message = error instanceof Error ? error.message : "";
    if (message === "Task board not found") this.notFound("Task board");
    if (message === "Task must have a taskBoardId") this.badRequest(message);
    throw error;
  }

  private async loadAllTasksWithRelations(
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
    const labelsByTaskId = await this.loadLabelNamesByTaskIds(
      allTaskRows.map((row) => row.id),
    );
    return Promise.all(
      topLevelTasks.map((taskRow) =>
        this.convertTaskRowToTask(taskRow, allTaskRows, labelsByTaskId),
      ),
    );
  }

  private async loadLabelNamesByTaskIds(
    taskIds: string[],
  ): Promise<Map<string, string[]>> {
    if (taskIds.length === 0) return new Map();

    const rows = await this.db
      .select({
        taskId: taskLabelsTable.taskId,
        name: labelsTable.name,
        position: taskLabelsTable.position,
      })
      .from(taskLabelsTable)
      .innerJoin(labelsTable, eq(taskLabelsTable.labelId, labelsTable.id))
      .where(inArray(taskLabelsTable.taskId, taskIds))
      .orderBy(asc(taskLabelsTable.taskId), asc(taskLabelsTable.position));

    const map = new Map<string, string[]>();
    for (const row of rows) {
      const list = map.get(row.taskId) ?? [];
      list.push(row.name);
      map.set(row.taskId, list);
    }
    return map;
  }
}

function serializeTask(task: Task): SerializedTask {
  return {
    id: task.id,
    taskBoardId: task.taskBoardId,
    taskKey: task.taskKey,
    summary: task.summary,
    description: task.description,
    status: task.status,
    priority: task.priority,
    labels: task.labels || [],
    dueDate: tasksHelper.date.toISOString(task.dueDate),
    estimation: task.estimation,
    subtasks: (task.subtasks || []).map((subtask) => serializeTask(subtask)),
    scheduleDate: tasksHelper.date.toISOString(task.scheduleDate),
  };
}

interface SerializedTask {
  id: string;
  taskBoardId: string;
  taskKey?: string;
  summary: string;
  description: string;
  status: string;
  priority: string;
  labels: string[];
  dueDate?: string;
  estimation?: number;
  subtasks: SerializedTask[];
  scheduleDate?: string;
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

export interface TaskStatistics {
  tasksCreated: number;
  tasksCompleted: number;
  avgCompletionTimeDays: number;
  overdueRate: number;
}
