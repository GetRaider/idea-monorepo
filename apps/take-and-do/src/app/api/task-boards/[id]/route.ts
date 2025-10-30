import { NextRequest, NextResponse } from "next/server";
import { getTaskBoardById } from "@/app/api/mock-data";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: taskBoardId } = await params;

  const taskBoard = getTaskBoardById(taskBoardId);

  if (!taskBoard) {
    return NextResponse.json(
      { error: "Task board not found" },
      { status: 404 },
    );
  }

  return NextResponse.json(taskBoard);
}
