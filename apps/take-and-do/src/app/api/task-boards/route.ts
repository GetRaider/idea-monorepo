import { NextRequest, NextResponse } from "next/server";
import { getAllTaskBoards, createTaskBoard } from "@/db/queries";
import { TaskBoard } from "@/types/workspace";

export async function GET() {
  try {
    const taskBoards = await getAllTaskBoards();
    return NextResponse.json(taskBoards);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch task boards" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, folderId } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const taskBoardData: Omit<TaskBoard, "id" | "createdAt" | "updatedAt"> = {
      name: name.trim(),
      folderId: folderId || undefined,
    };

    const newTaskBoard = await createTaskBoard(taskBoardData);
    return NextResponse.json(newTaskBoard, { status: 201 });
  } catch (error) {
    console.error("Failed to create task board:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create task board";

    // Check for specific connection errors
    if (
      errorMessage.includes("ENOTFOUND") ||
      errorMessage.includes("getaddrinfo")
    ) {
      return NextResponse.json(
        {
          error:
            "Database connection failed. Please check your DB_CONNECTION_STRING environment variable and ensure the database hostname is correct.",
          details:
            process.env.NODE_ENV === "development" ? errorMessage : undefined,
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.stack
              : undefined
            : undefined,
      },
      { status: 500 },
    );
  }
}
