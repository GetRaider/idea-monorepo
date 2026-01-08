import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { tasks } from "@/db/modules/task/task.schema";
import { TaskStatus, TaskPriority } from "@/components/KanbanBoard/types";
import { gte, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = (searchParams.get("timeframe") || "all") as
      | "all"
      | "week"
      | "month"
      | "quarter";

    const now = new Date();
    let whereConditions = [];

    if (timeframe !== "all") {
      const startDate = new Date(now);
      switch (timeframe) {
        case "week":
          startDate.setDate(now.getDate() - 7);
          break;
        case "month":
          startDate.setMonth(now.getMonth() - 1);
          break;
        case "quarter":
          startDate.setMonth(now.getMonth() - 3);
          break;
      }
      whereConditions.push(gte(tasks.createdAt, startDate));
    }

    const query = db
      .select({
        status: tasks.status,
        priority: tasks.priority,
        dueDate: tasks.dueDate,
      })
      .from(tasks);

    const taskRows =
      whereConditions.length > 0
        ? await query.where(and(...whereConditions))
        : await query;

    const stats = {
      total: taskRows.length,
      todo: taskRows.filter((t) => t.status === TaskStatus.TODO).length,
      inProgress: taskRows.filter((t) => t.status === TaskStatus.IN_PROGRESS)
        .length,
      done: taskRows.filter((t) => t.status === TaskStatus.DONE).length,
      highPriority: taskRows.filter((t) => t.priority === TaskPriority.HIGH)
        .length,
      overdue: taskRows.filter(
        (t) =>
          t.dueDate &&
          new Date(t.dueDate) < now &&
          t.status !== TaskStatus.DONE,
      ).length,
    };

    return NextResponse.json(stats);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch stats", details: message },
      { status: 500 },
    );
  }
}
