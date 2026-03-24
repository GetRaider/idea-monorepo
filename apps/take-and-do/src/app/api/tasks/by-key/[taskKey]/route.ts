import { NextRequest, NextResponse } from "next/server";

import { dataAccessFromAuth, requireAuth } from "@/lib/api-auth";
import { getTaskByKey } from "@/lib/db/queries";
import { Task } from "@/components/Boards/KanbanBoard/types";

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
    scheduleDate: task.scheduleDate?.toISOString(),
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskKey: string }> },
) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const access = dataAccessFromAuth(authResult);
  try {
    const { taskKey } = await params;
    const result = await getTaskByKey(taskKey, access);

    if (!result) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({
      task: serializeTask(result.task),
      parent: result.parent ? serializeTask(result.parent) : null,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch task" },
      { status: 500 },
    );
  }
}
