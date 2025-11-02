import { NextRequest, NextResponse } from "next/server";
import { getTaskById, updateTask } from "@/app/api/mock-data";
import { Task } from "@/components/KanbanBoard/types";

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

    // Serialize response - explicitly include all fields including priority
    const response = {
      ...task,
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
      subtasks: task.subtasks || [],
      schedule: task.schedule,
    };

    return NextResponse.json(response);
  } catch (error) {
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

    // Deserialize date if present
    const updateData = {
      ...updates,
      dueDate: updates.dueDate ? new Date(updates.dueDate) : undefined,
    };

    const updatedTask = updateTask(taskId, updateData);

    if (!updatedTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Serialize response - explicitly include all fields including priority
    const response = {
      ...updatedTask,
      id: updatedTask.id,
      taskBoardId: updatedTask.taskBoardId,
      taskKey: updatedTask.taskKey,
      summary: updatedTask.summary,
      description: updatedTask.description,
      status: updatedTask.status,
      priority: updatedTask.priority,
      labels: updatedTask.labels || [],
      dueDate: updatedTask.dueDate?.toISOString(),
      estimation: updatedTask.estimation,
      subtasks: updatedTask.subtasks || [],
      schedule: updatedTask.schedule,
    };

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 },
    );
  }
}
