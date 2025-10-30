import { NextRequest, NextResponse } from "next/server";
import { getTasksByTaskBoardId } from "@/app/api/mock-data";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: taskBoardId } = await params;

  const tasks = getTasksByTaskBoardId(taskBoardId);

  // Serialize dates and ensure proper JSON structure
  const serializedTasks = tasks.map((task: any) => ({
    ...task,
    dueDate: task.dueDate?.toISOString(),
  }));

  return NextResponse.json(serializedTasks);
}
