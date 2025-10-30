import { NextRequest, NextResponse } from "next/server";
import { createTask } from "@/app/api/mock-data";
import { Task } from "@/components/KanbanBoard/KanbanBoard";

export async function POST(request: NextRequest) {
  try {
    const task = await request.json();

    // Deserialize date if present
    const taskData = {
      ...task,
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
    };

    const newTask = createTask(taskData);

    // Serialize response
    const response = {
      ...newTask,
      dueDate: newTask.dueDate?.toISOString(),
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 },
    );
  }
}
