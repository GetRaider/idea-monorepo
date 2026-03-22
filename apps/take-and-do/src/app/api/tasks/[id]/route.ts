import { NextRequest, NextResponse } from "next/server";
import { getTaskById, updateTask, deleteTask } from "@/lib/db/queries";
import { Task } from "@/components/Boards/KanbanBoard/types";
import { tasksHelper } from "@/helpers/task.helper";

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
  scheduleDate?: string;
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
    dueDate: tasksHelper.date.toISOString(task.dueDate),
    estimation: task.estimation,
    subtasks: (task.subtasks || []).map((subtask) => serializeTask(subtask)),
    scheduleDate: tasksHelper.date.toISOString(task.scheduleDate),
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: taskId } = await params;
    const task = await getTaskById(taskId);

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(serializeTask(task));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch task", details: message },
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
    const updateData = tasksHelper.fromJson.patch(await request.json());
    const updatedTask = await updateTask(taskId, updateData);

    if (!updatedTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(serializeTask(updatedTask));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to update task", details: message },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: taskId } = await params;
    await deleteTask(taskId);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to delete task", details: message },
      { status: 500 },
    );
  }
}
