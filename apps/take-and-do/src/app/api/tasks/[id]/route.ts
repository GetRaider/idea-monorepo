import { NextRequest, NextResponse } from "next/server";
import { getTaskById, updateTask } from "@/app/api/mock-data";
import { Task } from "@/components/KanbanBoard/types";

  // Serialized task type for JSON response
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
  schedule?: string;
}

// Helper to serialize a task (including subtasks) for JSON response
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
    dueDate: task.dueDate?.toISOString(),
    estimation: task.estimation,
    subtasks: (task.subtasks || []).map((subtask) => serializeTask(subtask)),
    schedule: task.schedule,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: taskId } = await params;
    const task = getTaskById(taskId);

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(serializeTask(task));
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch task" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: taskId } = await params;
    const updates = await request.json();

    // Process fields only if explicitly included in updates
    const updateData = { ...updates };
    if ("dueDate" in updates) {
      updateData.dueDate = updates.dueDate ? new Date(updates.dueDate) : undefined;
    }
    if ("estimation" in updates) {
      // null means "clear", 0 is valid, undefined means "not set"
      updateData.estimation = updates.estimation === null ? undefined : updates.estimation;
    }
    // Process subtask dates if subtasks are being updated
    if (updates.subtasks && Array.isArray(updates.subtasks)) {
      updateData.subtasks = updates.subtasks.map((subtask: Record<string, unknown>) => ({
        ...subtask,
        dueDate: subtask.dueDate ? new Date(subtask.dueDate as string) : undefined,
      }));
    }

    const updatedTask = updateTask(taskId, updateData);

    if (!updatedTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(serializeTask(updatedTask));
  } catch {
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 },
    );
  }
}
