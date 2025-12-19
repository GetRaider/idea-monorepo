import { NextRequest, NextResponse } from "next/server";
import {
  getAllTasks,
  getTasksByTaskBoardId,
  getTasksBySchedule,
  createTask,
} from "@/db/queries";
import { Task } from "@/components/KanbanBoard/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskBoardId = searchParams.get("taskBoardId");
    const schedule = searchParams.get("schedule");

    let tasks: Task[] = [];

    if (taskBoardId) {
      tasks = await getTasksByTaskBoardId(taskBoardId);
    } else if (schedule && (schedule === "today" || schedule === "tomorrow")) {
      tasks = await getTasksBySchedule(schedule);
    } else {
      tasks = await getAllTasks();
    }

    return NextResponse.json(tasks);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const task = await request.json();

    // Deserialize dates if present
    const taskData = {
      ...task,
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      scheduleDate: task.scheduleDate ? new Date(task.scheduleDate) : undefined,
    };

    const newTask = await createTask(taskData);

    return NextResponse.json(newTask, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 },
    );
  }
}
