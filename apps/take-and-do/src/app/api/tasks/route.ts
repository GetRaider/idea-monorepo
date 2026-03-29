import { NextRequest, NextResponse } from "next/server";

import {
  dataAccessFromAuth,
  requireAiAccess,
  requireAuth,
  requireNonAnonymous,
} from "@/lib/api-auth";
import {
  getAllTasks,
  getTasksByTaskBoardId,
  getTasksByDate,
  createTask,
  deleteAllTasksForTaskBoard,
} from "@/lib/db/queries";
import {
  Task,
  toTaskPriority,
  toTaskStatus,
} from "@/components/Boards/KanbanBoard/types";
import { aiServices } from "@/services/ai";
import { tasksHelper } from "@/helpers/task.helper";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const access = dataAccessFromAuth(authResult);
  try {
    const { searchParams } = new URL(request.url);
    const taskBoardId = searchParams.get("taskBoardId");
    const date = searchParams.get("date");

    let tasks: Task[] = [];

    if (taskBoardId) {
      tasks = await getTasksByTaskBoardId(taskBoardId, access);
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
      tasks = await getTasksByDate(targetDate, access);
    } else {
      tasks = await getAllTasks(access);
    }

    return NextResponse.json(tasks);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const authResult = await requireNonAnonymous();
  if (authResult instanceof NextResponse) return authResult;

  const access = dataAccessFromAuth(authResult);
  try {
    const taskBoardId = new URL(request.url).searchParams.get("taskBoardId");
    if (!taskBoardId?.trim()) {
      return NextResponse.json(
        { error: "taskBoardId query parameter is required" },
        { status: 400 },
      );
    }

    const deleted = await deleteAllTasksForTaskBoard(
      taskBoardId.trim(),
      access,
    );
    return NextResponse.json({ deleted });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete tasks for board" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const access = dataAccessFromAuth(authResult);
  try {
    let shouldUseAI: boolean | undefined;
    let text: string | undefined;
    let _composeOnly: boolean | undefined;
    let task: Omit<Task, "id">;

    try {
      const payload = tasksHelper.fromJson.postPayload(await request.json());
      shouldUseAI = payload.shouldUseAI;
      text = payload.text;
      _composeOnly = payload._composeOnly;
      task = payload.task;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (shouldUseAI && text) {
      const aiGate = await requireAiAccess();
      if (aiGate instanceof NextResponse) return aiGate;
    }

    let taskData: Omit<Task, "id">;

    // If AI composition is requested, compose the task first
    if (shouldUseAI && text) {
      const composedData = await aiServices.task.compose({ text });

      const taskBoardId =
        task.taskBoardId?.trim() || composedData.taskBoardId?.trim();
      if (!taskBoardId) {
        return NextResponse.json(
          { error: "taskBoardId is required" },
          { status: 400 },
        );
      }

      const scheduleDate =
        tasksHelper.date.parse(composedData.scheduleDate) ??
        tasksHelper.date.parse(task.scheduleDate);

      taskData = {
        taskBoardId,
        taskKey: task.taskKey ?? composedData.taskKey ?? undefined,
        summary: composedData.summary,
        description: tasksHelper.description.plainToHtml(
          composedData.description,
        ),
        status: toTaskStatus(composedData.status ?? task.status),
        priority: toTaskPriority(composedData.priority ?? task.priority),
        labels: composedData.labels ?? task.labels,
        dueDate:
          tasksHelper.date.parse(composedData.dueDate) ??
          tasksHelper.date.parse(task.dueDate),
        estimation: composedData.estimation ?? task.estimation,
        scheduleDate,
        subtasks:
          tasksHelper.fromJson.subtasksFromArray(composedData.subtasks) ??
          task.subtasks,
      };

      // If composeOnly flag is set, return the composed data without creating
      if (_composeOnly) {
        return NextResponse.json(taskData);
      }
    } else {
      if (!task.taskBoardId?.trim()) {
        return NextResponse.json(
          { error: "taskBoardId is required" },
          { status: 400 },
        );
      }
      taskData = {
        taskBoardId: task.taskBoardId,
        taskKey: task.taskKey,
        summary: task.summary ?? "",
        description: task.description ?? "",
        status: toTaskStatus(task.status),
        priority: toTaskPriority(task.priority),
        labels: task.labels,
        dueDate: tasksHelper.date.parse(task.dueDate),
        scheduleDate: tasksHelper.date.parse(task.scheduleDate),
        estimation: task.estimation,
        subtasks: task.subtasks,
      };
    }

    const newTask = await createTask(taskData, access);

    return NextResponse.json(
      access.isAnonymous ? { ...newTask, guest: true } : newTask,
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to create task", details: message },
      { status: 500 },
    );
  }
}
