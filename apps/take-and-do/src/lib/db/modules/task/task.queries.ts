import { eq, and, isNull, inArray, gte, lt } from "drizzle-orm";

import { type DataAccess, dataAccessFilter } from "../../data-access";
import { db } from "../../client";
import { tasks } from "./task.schema";
import { labelsTable } from "../label/label.schema";
import {
  Task,
  TaskPriority,
  TaskStatus,
  TaskUpdate,
} from "@/components/Boards/KanbanBoard/types";
import { generateId } from "../utils";
import { getTaskBoardById } from "../taskBoard/taskBoard.queries";
import { tasksHelper } from "@/helpers/task.helper";
import {
  assignSubtaskIdsAndKeys,
  boardNameToTaskKeyPrefix,
  deriveTaskKeyPrefix,
  extractNumericPortion,
} from "@/lib/task-key.helpers";

async function getMaxNumericAmongDirectSubtasks(
  parentTaskId: string,
  access: DataAccess,
): Promise<number> {
  const accessCond = dataAccessFilter(tasks, access.userId, access.isAnonymous);
  const rows = await db
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

async function getMaxNumericSuffixForBoard(
  taskBoardId: string,
  boardPrefix: string,
  access: DataAccess,
): Promise<number> {
  const rows = await db
    .select({ taskKey: tasks.taskKey })
    .from(tasks)
    .where(
      and(
        eq(tasks.taskBoardId, taskBoardId),
        dataAccessFilter(tasks, access.userId, access.isAnonymous),
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

async function generateNextTaskKeyForBoard(
  taskBoardId: string,
  access: DataAccess,
): Promise<string> {
  const board = await getTaskBoardById(taskBoardId, access);
  const prefix = boardNameToTaskKeyPrefix(board ?? null);
  const maxNum = await getMaxNumericSuffixForBoard(taskBoardId, prefix, access);
  return `${prefix}-${maxNum + 1}`;
}

async function rekeySubtasksAfterParentBoardMove(
  parentTaskId: string,
  newTaskBoardId: string,
  access: DataAccess,
): Promise<void> {
  const subtaskRows = await db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.parentTaskId, parentTaskId),
        dataAccessFilter(tasks, access.userId, access.isAnonymous),
      ),
    );

  const sorted = [...subtaskRows].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  );

  const board = await getTaskBoardById(newTaskBoardId, access);
  const prefix = boardNameToTaskKeyPrefix(board ?? null);
  let nextNum = await getMaxNumericSuffixForBoard(
    newTaskBoardId,
    prefix,
    access,
  );
  const now = new Date();
  for (const row of sorted) {
    nextNum += 1;
    const nextKey = `${prefix}-${nextNum}`;
    await db
      .update(tasks)
      .set({
        taskKey: nextKey,
        taskBoardId: newTaskBoardId,
        updatedAt: now,
      })
      .where(eq(tasks.id, row.id));
  }
}

async function convertTaskRowToTask(
  taskRow: typeof tasks.$inferSelect,
  allTasks: Array<typeof tasks.$inferSelect>,
): Promise<Task> {
  const subtaskRows = allTasks.filter((t) => t.parentTaskId === taskRow.id);
  const subtasks = await Promise.all(
    subtaskRows.map((subtaskRow) => convertTaskRowToTask(subtaskRow, allTasks)),
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

async function loadAllTasksWithRelations(
  access: DataAccess,
  filter?: {
    taskBoardId?: string;
    date?: Date;
    parentTaskId?: string | null;
  },
): Promise<Task[]> {
  const accessCond = dataAccessFilter(tasks, access.userId, access.isAnonymous);
  let allTaskRows: Array<typeof tasks.$inferSelect> = [];

  if (filter?.date) {
    // For scheduled views, first get top-level tasks that match the date
    const targetDate = new Date(filter.date);
    targetDate.setHours(0, 0, 0, 0);

    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Get top-level tasks matching the date
    const scheduledTopLevelTasks = await db
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

    if (scheduledTopLevelTasks.length === 0) {
      return [];
    }

    // Get all task board IDs from scheduled tasks
    const taskBoardIds = [
      ...new Set(scheduledTopLevelTasks.map((t) => t.taskBoardId)),
    ];

    // Fetch ALL tasks from those boards (including subtasks regardless of scheduleDate)
    const boardConditions = [
      accessCond,
      inArray(tasks.taskBoardId, taskBoardIds),
    ];
    if (filter?.taskBoardId) {
      boardConditions.push(eq(tasks.taskBoardId, filter.taskBoardId));
    }

    const allBoardTasks = await db
      .select()
      .from(tasks)
      .where(and(...boardConditions));

    // Helper function to recursively find all descendant task IDs
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
        const childDescendants = findDescendantIds(child.id, taskList);
        childDescendants.forEach((id) => descendants.add(id));
      }
      return descendants;
    };

    // Collect all task IDs to include (scheduled tasks + all their descendants)
    const taskIdsToInclude = new Set<string>();
    for (const scheduledTask of scheduledTopLevelTasks) {
      const descendants = findDescendantIds(scheduledTask.id, allBoardTasks);
      descendants.forEach((id) => taskIdsToInclude.add(id));
    }

    // Filter to only include scheduled tasks and their subtasks
    allTaskRows = allBoardTasks.filter((task) => taskIdsToInclude.has(task.id));
  } else {
    // Regular filtering (not schedule-based)
    const conditions = [accessCond];
    if (filter?.taskBoardId) {
      conditions.push(eq(tasks.taskBoardId, filter.taskBoardId));
    }
    if (filter?.parentTaskId !== undefined) {
      if (filter.parentTaskId === null) {
        conditions.push(isNull(tasks.parentTaskId));
      } else {
        conditions.push(eq(tasks.parentTaskId, filter.parentTaskId));
      }
    }

    allTaskRows = await db
      .select()
      .from(tasks)
      .where(and(...conditions));
  }

  const topLevelTasks = allTaskRows.filter((t) => !t.parentTaskId);

  const result = await Promise.all(
    topLevelTasks.map((taskRow) => convertTaskRowToTask(taskRow, allTaskRows)),
  );

  return result;
}

async function syncTaskLabels(
  _taskId: string,
  labelNames: string[],
): Promise<void> {
  for (const rawName of labelNames) {
    const name = rawName.trim();
    if (!name) continue;

    const existing = await db
      .select()
      .from(labelsTable)
      .where(eq(labelsTable.name, name));

    if (existing.length > 0) continue;

    await db.insert(labelsTable).values({
      id: generateId(),
      name,
      createdAt: new Date(),
    });
  }
}

async function processSubtasks(
  taskBoardId: string,
  parentTaskId: string,
  parentTaskKey: string | null | undefined,
  subtasks: Task[],
  access: DataAccess,
): Promise<Array<{ id: string; taskKey: string }>> {
  const board = await getTaskBoardById(taskBoardId, access);
  const accessCond = dataAccessFilter(tasks, access.userId, access.isAnonymous);

  const existingSubtasks = await db
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
      await getMaxNumericAmongDirectSubtasks(parentTaskId, access),
    );
  } else {
    prefix = boardNameToTaskKeyPrefix(board ?? null);
    initialNextNum = await getMaxNumericSuffixForBoard(
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

function createTaskInMemoryWithoutDatabase(
  taskData: Omit<Task, "id">,
  access: DataAccess,
  options?: { taskBoardName?: string },
): Task {
  if (!access.isAnonymous) {
    throw new Error("createTaskInMemoryWithoutDatabase: anonymous only");
  }
  if (!taskData.taskBoardId?.trim()) {
    throw new Error("Task must have a taskBoardId");
  }

  const taskId = generateId();
  const boardForPrefix = options?.taskBoardName?.trim()
    ? { name: options.taskBoardName.trim() }
    : null;
  const boardPrefix = boardNameToTaskKeyPrefix(boardForPrefix);
  let taskKey = taskData.taskKey?.trim();
  if (!taskKey) {
    taskKey = `${boardPrefix}-${generateId().slice(0, 10)}`;
  }

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

  if (!taskData.subtasks?.length) {
    return baseTask;
  }

  const subtaskPrefix = deriveTaskKeyPrefix(taskKey);
  const parentNumeric = extractNumericPortion(taskKey) ?? 0;
  const processedSubtasks = assignSubtaskIdsAndKeys(
    taskData.subtasks,
    subtaskPrefix,
    parentNumeric,
    () => undefined,
  );

  const subtasks: Task[] = taskData.subtasks.map((subtask, index) => {
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
  });

  return { ...baseTask, subtasks };
}

// Public query functions
export async function getAllTasks(access: DataAccess): Promise<Task[]> {
  return loadAllTasksWithRelations(access);
}

export async function getTasksByTaskBoardId(
  taskBoardId: string,
  access: DataAccess,
): Promise<Task[]> {
  return loadAllTasksWithRelations(access, { taskBoardId });
}

export async function getTasksByDate(
  date: Date,
  access: DataAccess,
): Promise<Task[]> {
  return loadAllTasksWithRelations(access, { date });
}

export async function getTaskById(
  taskId: string,
  access: DataAccess,
): Promise<Task | null> {
  const accessCond = dataAccessFilter(tasks, access.userId, access.isAnonymous);
  const taskRows = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, taskId), accessCond));

  if (taskRows.length === 0) return null;

  const taskRow = taskRows[0];

  const allTaskRows = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.taskBoardId, taskRow.taskBoardId), accessCond));

  return convertTaskRowToTask(taskRow, allTaskRows);
}

export async function getTaskByKey(
  taskKey: string,
  access: DataAccess,
): Promise<{ task: Task; parent: Task | null } | null> {
  const accessCond = dataAccessFilter(tasks, access.userId, access.isAnonymous);
  const taskRows = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.taskKey, taskKey), accessCond));

  if (taskRows.length === 0) return null;

  const taskRow = taskRows[0];

  let parent: Task | null = null;
  if (taskRow.parentTaskId) {
    const parentRows = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskRow.parentTaskId), accessCond));
    if (parentRows.length > 0) {
      const allTaskRowsForParent = await db
        .select()
        .from(tasks)
        .where(and(eq(tasks.taskBoardId, taskRow.taskBoardId), accessCond));

      parent = await convertTaskRowToTask(parentRows[0], allTaskRowsForParent);
    }
  }

  const allTaskRows = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.taskBoardId, taskRow.taskBoardId), accessCond));

  const task = await convertTaskRowToTask(taskRow, allTaskRows);

  return { task, parent };
}

export async function createTask(
  taskData: Omit<Task, "id">,
  access: DataAccess,
  options?: { taskBoardName?: string },
): Promise<Task> {
  if (!taskData.taskBoardId) {
    throw new Error("Task must have a taskBoardId");
  }

  if (access.isAnonymous) {
    return createTaskInMemoryWithoutDatabase(taskData, access, options);
  }

  const board = await getTaskBoardById(taskData.taskBoardId, access);
  if (!board) {
    throw new Error("Task board not found");
  }

  const taskId = generateId();

  let taskKey = taskData.taskKey;
  if (!taskKey) {
    taskKey = await generateNextTaskKeyForBoard(taskData.taskBoardId, access);
  }

  await db.insert(tasks).values({
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

  if (taskData.subtasks && taskData.subtasks.length > 0) {
    const processedSubtasks = await processSubtasks(
      taskData.taskBoardId,
      taskId,
      taskKey,
      taskData.subtasks,
      access,
    );

    for (let i = 0; i < taskData.subtasks.length; i++) {
      const subtask = taskData.subtasks[i];
      const processed = processedSubtasks[i];

      await db.insert(tasks).values({
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

      // Handle subtask labels
      if (subtask.labels && subtask.labels.length > 0) {
        await syncTaskLabels(processed.id, subtask.labels);
      }
    }
  }

  // Handle labels
  if (taskData.labels && taskData.labels.length > 0) {
    await syncTaskLabels(taskId, taskData.labels);
  }

  const created = await getTaskById(taskId, access);
  if (!created) {
    throw new Error("Failed to retrieve created task");
  }
  return created;
}

export async function updateTask(
  taskId: string,
  updates: TaskUpdate,
  access: DataAccess,
): Promise<Task | null> {
  const accessCond = dataAccessFilter(tasks, access.userId, access.isAnonymous);
  const existingTaskRows = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, taskId), accessCond));

  if (existingTaskRows.length === 0) {
    return null;
  }

  const existingTask = existingTaskRows[0];

  const boardChanged =
    updates.taskBoardId !== undefined &&
    updates.taskBoardId !== existingTask.taskBoardId;

  if (boardChanged && updates.taskBoardId) {
    const newBoard = await getTaskBoardById(updates.taskBoardId, access);
    if (!newBoard) return null;
  }

  let parentKeyForSubtaskProcessing = existingTask.taskKey ?? null;

  const updateData: Partial<typeof tasks.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (updates.summary !== undefined) updateData.summary = updates.summary;
  if (updates.description !== undefined)
    updateData.description = updates.description;
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.priority !== undefined) updateData.priority = updates.priority;
  if (updates.dueDate !== undefined)
    updateData.dueDate = updates.dueDate ? updates.dueDate : null;
  if (updates.estimation !== undefined)
    updateData.estimation =
      updates.estimation !== null ? updates.estimation : null;
  if (updates.scheduleDate !== undefined)
    updateData.scheduleDate = updates.scheduleDate
      ? updates.scheduleDate
      : null;
  if (updates.taskBoardId !== undefined)
    updateData.taskBoardId = updates.taskBoardId;
  if (updates.isPublic !== undefined) updateData.isPublic = updates.isPublic;

  if (boardChanged && existingTask.parentTaskId == null) {
    const nextKey = await generateNextTaskKeyForBoard(
      updates.taskBoardId!,
      access,
    );
    updateData.taskKey = nextKey;
    parentKeyForSubtaskProcessing = nextKey;
  }

  const resolvedBoardIdForSubtasks =
    updates.taskBoardId !== undefined
      ? updates.taskBoardId
      : existingTask.taskBoardId;

  await db.update(tasks).set(updateData).where(eq(tasks.id, taskId));

  if (
    boardChanged &&
    existingTask.parentTaskId == null &&
    updates.subtasks === undefined
  ) {
    await rekeySubtasksAfterParentBoardMove(
      taskId,
      updates.taskBoardId!,
      access,
    );
  }

  if (updates.subtasks !== undefined) {
    await db.delete(tasks).where(eq(tasks.parentTaskId, taskId));

    if (updates.subtasks.length > 0) {
      const processedSubtasks = await processSubtasks(
        resolvedBoardIdForSubtasks,
        taskId,
        parentKeyForSubtaskProcessing,
        updates.subtasks,
        access,
      );

      for (let i = 0; i < updates.subtasks.length; i++) {
        const subtask = updates.subtasks[i];
        const processed = processedSubtasks[i];

        await db.insert(tasks).values({
          id: processed.id,
          userId: access.userId,
          isPublic: false,
          taskBoardId: subtask.taskBoardId || resolvedBoardIdForSubtasks,
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

        // Handle subtask labels
        if (subtask.labels && subtask.labels.length > 0) {
          await syncTaskLabels(processed.id, subtask.labels);
        }
      }
    }
  }

  // Handle labels update
  if (updates.labels !== undefined) {
    await syncTaskLabels(taskId, updates.labels);
  }

  const updated = await getTaskById(taskId, access);
  return updated;
}

export async function deleteTask(
  taskId: string,
  access: DataAccess,
): Promise<void> {
  const existing = await getTaskById(taskId, access);
  if (!existing) {
    return;
  }
  await db.delete(tasks).where(eq(tasks.id, taskId));
}

export async function deleteAllTasksForTaskBoard(
  taskBoardId: string,
  access: DataAccess,
): Promise<number> {
  const accessCond = dataAccessFilter(tasks, access.userId, access.isAnonymous);
  const rows = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(and(eq(tasks.taskBoardId, taskBoardId), accessCond));
  const n = rows.length;
  if (n === 0) return 0;

  await db
    .delete(tasks)
    .where(and(eq(tasks.taskBoardId, taskBoardId), accessCond));
  return n;
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

export async function getTasksForOptimization(
  taskIds: string[],
  access: DataAccess,
): Promise<TaskForOptimization[]> {
  if (taskIds.length === 0) return [];

  const accessCond = dataAccessFilter(tasks, access.userId, access.isAnonymous);
  const taskRows = await db
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

  return taskRows.map((row) => ({
    id: row.id,
    summary: row.summary,
    priority: row.priority,
    dueDate: row.dueDate,
    estimation: row.estimation,
    scheduleDate: row.scheduleDate,
    status: row.status,
  }));
}

export async function getTaskStatistics(
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

  const accessCond = dataAccessFilter(tasks, access.userId, access.isAnonymous);
  const query = db
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

  const tasksCreated = allTasks.length;
  const completedTasks = allTasks.filter((t) => t.status === "Done");

  const tasksCompleted = completedTasks.length;

  let avgCompletionTimeDays = 0;
  if (completedTasks.length > 0) {
    const completionTimes = completedTasks
      .map((task) => {
        const created = new Date(task.createdAt).getTime();
        const updated = new Date(task.updatedAt).getTime();
        return (updated - created) / (1000 * 60 * 60 * 24);
      })
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

  const overdueRate =
    tasksWithDueDate.length > 0
      ? overdueTasks.length / tasksWithDueDate.length
      : 0;

  return {
    tasksCreated,
    tasksCompleted,
    avgCompletionTimeDays: Math.round(avgCompletionTimeDays * 10) / 10,
    overdueRate: Math.round(overdueRate * 100) / 100,
  };
}
