import { NextRequest, NextResponse } from "next/server";
import { updateTask } from "@/app/api/mock-data";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: taskId } = await params;
    const updates = await request.json();

    // Deserialize date if present
    const updateData = {
      ...updates,
      dueDate: updates.dueDate ? new Date(updates.dueDate) : undefined,
    };

    const updatedTask = updateTask(taskId, updateData);

    if (!updatedTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Serialize response
    const response = {
      ...updatedTask,
      dueDate: updatedTask.dueDate?.toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 },
    );
  }
}
