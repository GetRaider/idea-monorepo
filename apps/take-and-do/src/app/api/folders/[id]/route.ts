import { NextRequest, NextResponse } from "next/server";
import {
  getFolderById,
  updateFolder,
  deleteFolder,
} from "@/lib/db/queries";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: folderId } = await params;
    const folder = await getFolderById(folderId);

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    return NextResponse.json(folder);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch folder" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: folderId } = await params;
    const folder = await getFolderById(folderId);
    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }
    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      if (error instanceof SyntaxError) {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
      }
      throw error;
    }
    const { name, emoji } = body as { name?: unknown; emoji?: unknown };

    const updates: { name?: string; emoji?: string | null } = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return NextResponse.json(
          { error: "Name must be a non-empty string" },
          { status: 400 },
        );
      }
      updates.name = name.trim();
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
      return NextResponse.json(
        { error: "No updates provided" },
        { status: 400 },
      );
    }

    const updated = await updateFolder(folderId, updates);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: "Failed to update folder" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: folderId } = await params;
    const folder = await getFolderById(folderId);
    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }
    await deleteFolder(folderId);
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete folder" },
      { status: 500 },
    );
  }
}
