import { eq, and, isNull, inArray, gte, lt } from "drizzle-orm";
import { db } from "../../client";
import { tasks } from "./task.schema";
import { taskLabels } from "../taskLabel/taskLabel.schema";
import { labels } from "../label/label.schema";
import { Task, TaskPriority, TaskStatus } from "@/components/KanbanBoard/types";
import { generateId } from "../utils";
import { getTaskBoardById } from "../taskBoard/taskBoard.queries";

// Helper functions
function deriveTaskKeyPrefix(taskKey?: string | null): string {
  if (!taskKey) return "TASK";
  const segments = taskKey.split("-").filter(Boolean);
  if (!segments.length) return "TASK";

  const numericIndex = segments.findIndex((segment) => /^\d+$/.test(segment));
  if (numericIndex > 0) {
    return segments.slice(0, numericIndex).join("-");
  }

  return segments[0] || "TASK";
}

function extractNumericPortion(taskKey?: string | null): number | null {
  if (!taskKey) return null;
  const matches = taskKey.match(/\d+/g);
  if (!matches?.length) return null;
  const numericValue = parseInt(matches[matches.length - 1], 10);
  return Number.isNaN(numericValue) ? null : numericValue;
}

function generateSubtaskKey(
  parentTaskKey: string | null | undefined,
  existingSubtasks: Array<{ taskKey: string | null }>,
): string {
  const prefix = deriveTaskKeyPrefix(parentTaskKey);
  const parentNumber = extractNumericPortion(parentTaskKey);
  const subtaskNumbers = existingSubtasks
    .map((subtask) => extractNumericPortion(subtask.taskKey))
    .filter((value): value is number => value !== null);

  const highestExistingNumber = Math.max(
    ...(parentNumber !== null ? [parentNumber] : []),
    ...(subtaskNumbers.length ? subtaskNumbers : [0]),
  );

  return `${prefix}-${highestExistingNumber + 1}`;
}

async function convertTaskRowToTask(
  taskRow: typeof tasks.$inferSelect,
  allTasks: Array<typeof tasks.$inferSelect>,
  taskLabelsMap: Map<string, string[]>,
): Promise<Task> {
  const taskLabelNames = taskLabelsMap.get(taskRow.id) || [];
  const subtaskRows = allTasks.filter((t) => t.parentTaskId === taskRow.id);
  const subtasks = await Promise.all(
    subtaskRows.map((subtaskRow) =>
      convertTaskRowToTask(subtaskRow, allTasks, taskLabelsMap),
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
    labels: taskLabelNames.length > 0 ? taskLabelNames : undefined,
    dueDate: taskRow.dueDate ? new Date(taskRow.dueDate) : undefined,
    estimation: taskRow.estimation || undefined,
    subtasks: subtasks.length > 0 ? subtasks : undefined,
    schedule: (taskRow.schedule as "today" | "tomorrow") || undefined,
    scheduleDate: taskRow.scheduleDate
      ? new Date(taskRow.scheduleDate)
      : undefined,
  };
}

async function loadAllTasksWithRelations(filter?: {
  taskBoardId?: string;
  schedule?: "today" | "tomorrow";
  parentTaskId?: string | null;
}): Promise<Task[]> {
  let allTaskRows: Array<typeof tasks.$inferSelect> = [];

  if (filter?.schedule) {
    // For scheduled views, first get top-level tasks that match the schedule
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetDate = new Date(today);
    if (filter.schedule === "tomorrow") {
      targetDate.setDate(targetDate.getDate() + 1);
    }

    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Get top-level tasks matching the schedule
    const scheduledTopLevelTasks = await db
      .select()
      .from(tasks)
      .where(
        and(
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
    const boardConditions = [inArray(tasks.taskBoardId, taskBoardIds)];
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
    const conditions = [];
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
      .where(conditions.length > 0 ? and(...conditions) : undefined);
  }

  const allTaskLabelRows = await db.select().from(taskLabels);
  const allLabelRows = await db.select().from(labels);
  const labelMap = new Map<string, string>();
  allLabelRows.forEach((label) => {
    labelMap.set(label.id, label.name);
  });
  const taskLabelsMap = new Map<string, string[]>();
  allTaskLabelRows.forEach((taskLabel) => {
    const labelName = labelMap.get(taskLabel.labelId);
    if (labelName) {
      const existing = taskLabelsMap.get(taskLabel.taskId) || [];
      existing.push(labelName);
      taskLabelsMap.set(taskLabel.taskId, existing);
    }
  });

  const topLevelTasks = allTaskRows.filter((t) => !t.parentTaskId);

  const result = await Promise.all(
    topLevelTasks.map((taskRow) =>
      convertTaskRowToTask(taskRow, allTaskRows, taskLabelsMap),
    ),
  );

  return result;
}

// Sync task labels (create labels if they don't exist, then link them)
async function syncTaskLabels(
  taskId: string,
  labelNames: string[],
): Promise<void> {
  // Get or create labels
  const labelIds: string[] = [];
  for (const labelName of labelNames) {
    const existingLabels = await db
      .select()
      .from(labels)
      .where(eq(labels.name, labelName));

    let labelId: string;
    if (existingLabels.length > 0) {
      labelId = existingLabels[0].id;
    } else {
      labelId = generateId();
      await db.insert(labels).values({
        id: labelId,
        name: labelName,
        createdAt: new Date(),
      });
    }
    labelIds.push(labelId);
  }

  // Remove existing task labels
  await db.delete(taskLabels).where(eq(taskLabels.taskId, taskId));

  // Insert new task labels
  if (labelIds.length > 0) {
    await db.insert(taskLabels).values(
      labelIds.map((labelId) => ({
        taskId,
        labelId,
      })),
    );
  }
}

// Process subtasks: assign id and taskKey to new subtasks
async function processSubtasks(
  parentTaskId: string,
  parentTaskKey: string | null | undefined,
  subtasks: Task[],
): Promise<Array<{ id: string; taskKey: string }>> {
  const processed: Array<{ id: string; taskKey: string }> = [];

  // Get existing subtasks from DB to consider in key generation
  const existingSubtasks = await db
    .select()
    .from(tasks)
    .where(eq(tasks.parentTaskId, parentTaskId));

  // Map existing subtasks by their IDs for quick lookup
  const existingSubtasksMap = new Map(
    existingSubtasks.map((st) => [st.id, st]),
  );

  for (const subtask of subtasks) {
    const hasValidId =
      subtask.id && typeof subtask.id === "string" && subtask.id.length > 0;

    if (hasValidId) {
      // Existing subtask - use existing taskKey or generate one
      const existing = existingSubtasksMap.get(subtask.id);
      processed.push({
        id: subtask.id,
        taskKey:
          subtask.taskKey ||
          existing?.taskKey ||
          generateSubtaskKey(parentTaskKey, processed),
      });
    } else {
      // New subtask: generate id and taskKey
      const newId = generateId();
      // Include existing subtasks in key generation
      const allSubtasksForKeyGen = [
        ...processed,
        ...existingSubtasks.map((st) => ({ taskKey: st.taskKey })),
      ];
      const newTaskKey = generateSubtaskKey(
        parentTaskKey,
        allSubtasksForKeyGen,
      );
      processed.push({ id: newId, taskKey: newTaskKey });
    }
  }

  return processed;
}

// Public query functions
export async function getAllTasks(): Promise<Task[]> {
  return loadAllTasksWithRelations();
}

export async function getTasksByTaskBoardId(
  taskBoardId: string,
): Promise<Task[]> {
  return loadAllTasksWithRelations({ taskBoardId });
}

export async function getTasksBySchedule(
  schedule: "today" | "tomorrow",
): Promise<Task[]> {
  return loadAllTasksWithRelations({ schedule });
}

export async function getTaskById(taskId: string): Promise<Task | null> {
  // Fetch the task
  const taskRows = await db.select().from(tasks).where(eq(tasks.id, taskId));

  if (taskRows.length === 0) return null;

  const taskRow = taskRows[0];

  // Fetch all tasks from the same task board to get subtasks
  const allTaskRows = await db
    .select()
    .from(tasks)
    .where(eq(tasks.taskBoardId, taskRow.taskBoardId));

  // Fetch labels
  const taskLabelRows = await db
    .select()
    .from(taskLabels)
    .where(eq(taskLabels.taskId, taskId));
  const labelIds = taskLabelRows.map((tl) => tl.labelId);
  const labelRows =
    labelIds.length > 0
      ? await db.select().from(labels).where(inArray(labels.id, labelIds))
      : [];

  const taskLabelsMap = new Map<string, string[]>();
  const labelMap = new Map<string, string>();
  labelRows.forEach((label) => {
    labelMap.set(label.id, label.name);
  });
  taskLabelRows.forEach((taskLabel) => {
    const labelName = labelMap.get(taskLabel.labelId);
    if (labelName) {
      const existing = taskLabelsMap.get(taskLabel.taskId) || [];
      existing.push(labelName);
      taskLabelsMap.set(taskLabel.taskId, existing);
    }
  });

  return convertTaskRowToTask(taskRow, allTaskRows, taskLabelsMap);
}

export async function getTaskByKey(
  taskKey: string,
): Promise<{ task: Task; parent: Task | null } | null> {
  // Find task by key
  const taskRows = await db
    .select()
    .from(tasks)
    .where(eq(tasks.taskKey, taskKey));

  if (taskRows.length === 0) return null;

  const taskRow = taskRows[0];

  // If it's a subtask, find parent
  let parent: Task | null = null;
  if (taskRow.parentTaskId) {
    const parentRows = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, taskRow.parentTaskId));
    if (parentRows.length > 0) {
      // Load all tasks from same board for subtask conversion
      const allTaskRows = await db
        .select()
        .from(tasks)
        .where(eq(tasks.taskBoardId, taskRow.taskBoardId));

      // Load labels
      const allTaskLabelRows = await db.select().from(taskLabels);
      const allLabelRows = await db.select().from(labels);
      const labelMap = new Map<string, string>();
      allLabelRows.forEach((label) => {
        labelMap.set(label.id, label.name);
      });
      const taskLabelsMap = new Map<string, string[]>();
      allTaskLabelRows.forEach((taskLabel) => {
        const labelName = labelMap.get(taskLabel.labelId);
        if (labelName) {
          const existing = taskLabelsMap.get(taskLabel.taskId) || [];
          existing.push(labelName);
          taskLabelsMap.set(taskLabel.taskId, existing);
        }
      });

      parent = await convertTaskRowToTask(
        parentRows[0],
        allTaskRows,
        taskLabelsMap,
      );
    }
  }

  // Load all tasks from same board for conversion
  const allTaskRows = await db
    .select()
    .from(tasks)
    .where(eq(tasks.taskBoardId, taskRow.taskBoardId));

  // Load labels
  const allTaskLabelRows = await db.select().from(taskLabels);
  const allLabelRows = await db.select().from(labels);
  const labelMap = new Map<string, string>();
  allLabelRows.forEach((label) => {
    labelMap.set(label.id, label.name);
  });
  const taskLabelsMap = new Map<string, string[]>();
  allTaskLabelRows.forEach((taskLabel) => {
    const labelName = labelMap.get(taskLabel.labelId);
    if (labelName) {
      const existing = taskLabelsMap.get(taskLabel.taskId) || [];
      existing.push(labelName);
      taskLabelsMap.set(taskLabel.taskId, existing);
    }
  });

  const task = await convertTaskRowToTask(taskRow, allTaskRows, taskLabelsMap);

  return { task, parent };
}

export async function createTask(taskData: Omit<Task, "id">): Promise<Task> {
  if (!taskData.taskBoardId) {
    throw new Error("Task must have a taskBoardId");
  }

  const taskId = generateId();

  // Generate task key if not provided
  let taskKey = taskData.taskKey;
  if (!taskKey) {
    // Get all tasks from this board to generate next key
    const boardTasks = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.taskBoardId, taskData.taskBoardId),
          isNull(tasks.parentTaskId),
        ),
      );

    // Extract task board name prefix (simplified - use first 2-3 chars of board name)
    const board = await getTaskBoardById(taskData.taskBoardId);
    const prefix = board
      ? board.name
          .substring(0, 3)
          .toUpperCase()
          .replace(/[^A-Z]/g, "")
      : "TASK";
    const maxNum = Math.max(
      ...boardTasks
        .map((t) => extractNumericPortion(t.taskKey))
        .filter((n): n is number => n !== null),
      0,
    );
    taskKey = `${prefix}-${String(maxNum + 1).padStart(3, "0")}`;
  }

  // Insert main task
  await db.insert(tasks).values({
    id: taskId,
    taskBoardId: taskData.taskBoardId,
    taskKey,
    summary: taskData.summary,
    description: taskData.description || "",
    status: taskData.status,
    priority: taskData.priority,
    dueDate: taskData.dueDate || null,
    estimation: taskData.estimation || null,
    schedule: taskData.schedule || null,
    scheduleDate: taskData.scheduleDate || null,
    parentTaskId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Handle subtasks
  if (taskData.subtasks && taskData.subtasks.length > 0) {
    const processedSubtasks = await processSubtasks(
      taskId,
      taskKey,
      taskData.subtasks,
    );

    for (let i = 0; i < taskData.subtasks.length; i++) {
      const subtask = taskData.subtasks[i];
      const processed = processedSubtasks[i];

      await db.insert(tasks).values({
        id: processed.id,
        taskBoardId: subtask.taskBoardId || taskData.taskBoardId,
        taskKey: processed.taskKey,
        summary: subtask.summary,
        description: subtask.description || "",
        status: subtask.status,
        priority: subtask.priority,
        dueDate: subtask.dueDate || null,
        estimation: subtask.estimation || null,
        schedule: subtask.schedule || null,
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

  // Return the created task
  const created = await getTaskById(taskId);
  if (!created) {
    throw new Error("Failed to retrieve created task");
  }
  return created;
}

export async function updateTask(
  taskId: string,
  updates: Partial<Task>,
): Promise<Task | null> {
  // Check if task exists
  const existingTaskRows = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, taskId));

  if (existingTaskRows.length === 0) {
    // Check if it's a subtask
    const subtaskRows = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, taskId));

    if (subtaskRows.length === 0) return null;
  }

  const existingTask = existingTaskRows[0];

  // Build update object
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
  if (updates.schedule !== undefined)
    updateData.schedule = updates.schedule || null;
  if (updates.scheduleDate !== undefined)
    updateData.scheduleDate = updates.scheduleDate
      ? updates.scheduleDate
      : null;
  if (updates.taskBoardId !== undefined)
    updateData.taskBoardId = updates.taskBoardId;

  // Update task
  await db.update(tasks).set(updateData).where(eq(tasks.id, taskId));

  // Handle subtasks update
  if (updates.subtasks !== undefined) {
    // Delete existing subtasks
    await db.delete(tasks).where(eq(tasks.parentTaskId, taskId));

    // Insert new subtasks
    if (updates.subtasks.length > 0) {
      const processedSubtasks = await processSubtasks(
        taskId,
        existingTask.taskKey,
        updates.subtasks,
      );

      for (let i = 0; i < updates.subtasks.length; i++) {
        const subtask = updates.subtasks[i];
        const processed = processedSubtasks[i];

        await db.insert(tasks).values({
          id: processed.id,
          taskBoardId: subtask.taskBoardId || existingTask.taskBoardId,
          taskKey: processed.taskKey,
          summary: subtask.summary,
          description: subtask.description || "",
          status: subtask.status,
          priority: subtask.priority,
          dueDate: subtask.dueDate || null,
          estimation: subtask.estimation || null,
          schedule: subtask.schedule || null,
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

  // Return updated task
  const updated = await getTaskById(taskId);
  return updated;
}
