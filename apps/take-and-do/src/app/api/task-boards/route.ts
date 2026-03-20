import { NextRequest, NextResponse } from "next/server";

import { env } from "@/env";
import {
  getAllTaskBoards,
  createTaskBoard,
  getTaskBoardById,
  updateTaskBoard,
  deleteTaskBoard,
} from "@/lib/db/queries";
import { TaskBoard } from "@/types/workspace";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  try {
    if (id) {
      const board = await getTaskBoardById(id);
      if (!board) {
        return NextResponse.json(
          { error: "Task board not found" },
          { status: 404 },
        );
      }
      return NextResponse.json([board]);
    }

    const taskBoards = await getAllTaskBoards();
    return NextResponse.json(taskBoards);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch task boards" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { name, folderId, emoji } = body as {
      name?: unknown;
      folderId?: unknown;
      emoji?: unknown;
    };

    const updates: { name?: string; folderId?: string | null; emoji?: string | null } = {};
    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return NextResponse.json({ error: "Name must be a non-empty string" }, { status: 400 });
      }
      updates.name = name.trim();
    }
    if (folderId !== undefined) {
      if (folderId === null || folderId === "") {
        updates.folderId = null;
      } else if (typeof folderId === "string") {
        updates.folderId = folderId;
      } else {
        return NextResponse.json(
          { error: "folderId must be a string or null" },
          { status: 400 },
        );
      }
    }
    if (emoji !== undefined) {
      if (emoji === null) {
        updates.emoji = null;
      } else if (typeof emoji === "string") {
        const trimmed = emoji.trim();
        if (!trimmed) {
          return NextResponse.json(
            { error: "Emoji must be a non-empty string or null" },
            { status: 400 },
          );
        }
        updates.emoji = trimmed;
      } else {
        return NextResponse.json(
          { error: "Emoji must be a string or null" },
          { status: 400 },
        );
      }
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    const updated = await updateTaskBoard(id, updates);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: "Failed to update task board" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  try {
    await deleteTaskBoard(id);
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete task board" },
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
          details: env.nodeEnv === "development" ? errorMessage : undefined,
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details:
          env.nodeEnv === "development"
            ? error instanceof Error
              ? error.stack
              : undefined
            : undefined,
      },
      { status: 500 },
    );
  }
}
