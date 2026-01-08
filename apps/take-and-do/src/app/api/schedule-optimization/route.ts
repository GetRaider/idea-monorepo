import { NextRequest, NextResponse } from "next/server";
import { optimizeSchedule } from "@/lib/ai";
import { getTasksForOptimization } from "@/db/queries";
import { formatDateForAPI } from "@/utils/task.utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskIds } = body;

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          details: "'taskIds' must be a non-empty array",
        },
        { status: 400 },
      );
    }

    const tasks = await getTasksForOptimization(taskIds);

    if (tasks.length === 0) {
      return NextResponse.json(
        {
          error: "No tasks found",
          details: "Could not find any of the specified tasks",
        },
        { status: 404 },
      );
    }

    const currentDate = formatDateForAPI(new Date());

    const tasksForAI = tasks.map((task) => ({
      id: task.id,
      summary: task.summary,
      priority: task.priority,
      dueDate: task.dueDate ? formatDateForAPI(new Date(task.dueDate)) : null,
      estimation: task.estimation,
      scheduleDate: task.scheduleDate
        ? formatDateForAPI(new Date(task.scheduleDate))
        : null,
      status: task.status,
    }));

    const optimization = await optimizeSchedule({
      tasks: tasksForAI,
      currentDate,
    });

    return NextResponse.json({
      optimization,
      tasksCount: tasks.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Schedule optimization error:", error);
    return NextResponse.json(
      { error: "Failed to optimize schedule", details: message },
      { status: 500 },
    );
  }
}

