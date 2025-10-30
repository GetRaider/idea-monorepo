import { NextRequest, NextResponse } from "next/server";
import { getTasksBySchedule, getAllTasks } from "@/app/api/mock-data";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schedule = searchParams.get("schedule"); // 'today' or 'tomorrow'

    if (!schedule || (schedule !== "today" && schedule !== "tomorrow")) {
      return NextResponse.json(
        { error: "Invalid schedule parameter" },
        { status: 400 },
      );
    }

    // Get scheduled tasks
    const scheduledTasks = getTasksBySchedule(schedule);

    // Serialize dates and ensure proper JSON structure
    const serializedTasks = scheduledTasks.map((task: any) => {
      console.log("Serializing task:", {
        id: task.id,
        schedule: task.schedule,
      });
      return {
        ...task,
        schedule: task.schedule, // Explicitly include schedule
        dueDate: task.dueDate?.toISOString(),
      };
    });

    return NextResponse.json({
      [schedule]: serializedTasks,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch scheduled tasks" },
      { status: 500 },
    );
  }
}
