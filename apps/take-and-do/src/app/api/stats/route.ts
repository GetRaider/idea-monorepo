import { NextRequest, NextResponse } from "next/server";

import { dataAccessFromAuth, requireAuth } from "@/lib/api-auth";
import {
  TaskStatus,
  TaskPriority,
} from "@/components/Boards/KanbanBoard/types";
import { db } from "@/lib/db/client";
import { dataAccessFilter } from "@/lib/db/queries";
import { tasks } from "@/lib/db/modules/task/task.schema";
import { gte, and } from "drizzle-orm";
import { tasksHelper } from "@/helpers/task.helper";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const access = dataAccessFromAuth(authResult);
  const accessCond = dataAccessFilter(tasks, access.userId, access.isAnonymous);

  try {
    const { searchParams } = new URL(request.url);
    const timeframe = (searchParams.get("timeframe") || "all") as
      | "all"
      | "week"
      | "month"
      | "quarter";

    const now = new Date();
    const whereConditions = [accessCond];

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

    const taskRows = await query.where(and(...whereConditions));

    const stats = {
      total: taskRows.length,
      todo: taskRows.filter((t) => t.status === TaskStatus.TODO).length,
      inProgress: taskRows.filter((t) => t.status === TaskStatus.IN_PROGRESS)
        .length,
      done: taskRows.filter((t) => t.status === TaskStatus.DONE).length,
      highPriority: taskRows.filter((t) => t.priority === TaskPriority.HIGH)
        .length,
      overdue: taskRows.filter((taskRow) => {
        const due = tasksHelper.date.parse(taskRow.dueDate);
        return (
          due !== undefined && due < now && taskRow.status !== TaskStatus.DONE
        );
      }).length,
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
