import { NextRequest, NextResponse } from "next/server";
import {
  getAllTasks,
  getTasksByTaskBoardId,
  getTasksByDate,
  createTask,
} from "@/db/queries";
import { Task } from "@/components/KanbanBoard/types";
import { composeTask } from "@/lib/ai";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskBoardId = searchParams.get("taskBoardId");
    const date = searchParams.get("date");

    let tasks: Task[] = [];

    if (taskBoardId) {
      tasks = await getTasksByTaskBoardId(taskBoardId);
    } else if (date) {
      // Date filtering - parse YYYY-MM-DD as local date, not UTC
      const dateParts = date.split("-");
      if (dateParts.length !== 3) {
        return NextResponse.json(
          { error: "Invalid date format. Expected YYYY-MM-DD" },
          { status: 400 },
        );
      }
      const year = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1; // Month is 0-indexed
      const day = parseInt(dateParts[2], 10);
      const targetDate = new Date(year, month, day);
      if (isNaN(targetDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid date format" },
          { status: 400 },
        );
      }
      tasks = await getTasksByDate(targetDate);
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
    const body = await request.json();
    const { shouldUseAI, text, _composeOnly, ...task } = body;

    let taskData: Omit<Task, "id">;

    // If AI composition is requested, compose the task first
    if (shouldUseAI && text) {
      const composedData = await composeTask({ text });

      // Merge AI output with provided task data (task data takes precedence)
      let finalScheduleDate: Date | undefined;
      if (composedData.scheduleDate) {
        finalScheduleDate = new Date(composedData.scheduleDate);
      } else if (task.scheduleDate) {
        finalScheduleDate = new Date(task.scheduleDate);
      }

      taskData = {
        ...task,
        summary: composedData.summary,
        description: composedData.description,
        priority: (composedData.priority as Task["priority"]) || task.priority,
        status: (composedData.status as Task["status"]) || task.status,
        labels: composedData.labels || task.labels,
        dueDate: composedData.dueDate
          ? new Date(composedData.dueDate)
          : task.dueDate
            ? new Date(task.dueDate)
            : undefined,
        estimation: composedData.estimation || task.estimation,
        scheduleDate: finalScheduleDate,
        subtasks: composedData.subtasks || task.subtasks,
      };

      // If composeOnly flag is set, return the composed data without creating
      if (_composeOnly) {
        return NextResponse.json(taskData);
      }
    } else {
      // Regular task creation
      taskData = {
        ...task,
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        scheduleDate: task.scheduleDate
          ? new Date(task.scheduleDate)
          : undefined,
      };
    }

    const newTask = await createTask(taskData);

    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to create task", details: message },
      { status: 500 },
    );
  }
}
