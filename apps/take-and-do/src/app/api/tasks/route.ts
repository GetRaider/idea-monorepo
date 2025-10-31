import { NextRequest, NextResponse } from "next/server";
import {
  getAllTasks,
  getTasksByTaskBoardId,
  getTasksBySchedule,
  createTask,
} from "@/app/api/mock-data";
import { Task } from "@/components/KanbanBoard/KanbanBoard";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskBoardId = searchParams.get("taskBoardId");
    const schedule = searchParams.get("schedule");

    let tasks: Task[] = [];

    if (taskBoardId) {
      console.log("by task board id");
      tasks = getTasksByTaskBoardId(taskBoardId);
    } else if (schedule && (schedule === "today" || schedule === "tomorrow")) {
      console.log("by schedule");
      tasks = getTasksBySchedule(schedule);
    } else {
      console.log("by all tasks");
      tasks = getAllTasks();
    }

    // Serialize tasks - explicitly include all fields including priority
    // const serializedTasks = tasks.map((task: Task) => ({
    //   ...task,
    //   id: task.id,
    //   taskBoardId: task.taskBoardId,
    //   taskKey: task.taskKey,
    //   summary: task.summary,
    //   description: task.description,
    //   status: task.status,
    //   priority: task.priority,
    //   labels: task.labels || [],
    //   dueDate: task.dueDate?.toISOString(),
    //   estimation: task.estimation,
    //   subtasks: task.subtasks || [],
    //   schedule: task.schedule,
    // }));

    console.log({ hereTasks: tasks });

    return NextResponse.json(tasks);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const task = await request.json();

    // Deserialize date if present
    const taskData = {
      ...task,
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
    };

    const newTask = createTask(taskData);

    // Serialize response - explicitly include all fields including priority
    const response = {
      ...newTask,
      id: newTask.id,
      taskBoardId: newTask.taskBoardId,
      taskKey: newTask.taskKey,
      summary: newTask.summary,
      description: newTask.description,
      status: newTask.status,
      priority: newTask.priority,
      labels: newTask.labels || [],
      dueDate: newTask.dueDate?.toISOString(),
      estimation: newTask.estimation,
      subtasks: newTask.subtasks || [],
      schedule: newTask.schedule,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 },
    );
  }
}
