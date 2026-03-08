import { NextRequest, NextResponse } from "next/server";
import { aiServices } from "@/services/ai";
import { getTasksForOptimization } from "@/lib/db/queries";
import { tasksHelper } from "@/helpers/task.helper";

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

    const currentDate = tasksHelper.date.formatForAPI(new Date());

    const tasksForAI = tasks.map((task) => ({
      id: task.id,
      summary: task.summary,
      priority: tasksHelper.priority.format(task.priority),
      dueDate: task.dueDate
        ? tasksHelper.date.formatForAPI(new Date(task.dueDate))
        : null,
      estimation: task.estimation,
      scheduleDate: task.scheduleDate
        ? tasksHelper.date.formatForAPI(new Date(task.scheduleDate))
        : null,
      status: task.status,
    }));

    const optimization = await aiServices.schedule.optimize({
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
