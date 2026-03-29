import { NextRequest, NextResponse } from "next/server";

import { dataAccessFromAuth, requireAuth } from "@/lib/api-auth";
import { getFolderById, updateFolder, deleteFolder } from "@/lib/db/queries";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const access = dataAccessFromAuth(authResult);
  try {
    const { id: folderId } = await params;
    const folder = await getFolderById(folderId, access);

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
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const access = dataAccessFromAuth(authResult);
  try {
    const { id: folderId } = await params;
    if (!access.isAnonymous) {
      const folder = await getFolderById(folderId, access);
      if (!folder) {
        return NextResponse.json(
          { error: "Folder not found" },
          { status: 404 },
        );
      }
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
    const { name, emoji, isPublic, createdAt } = body as {
      name?: unknown;
      emoji?: unknown;
      isPublic?: unknown;
      createdAt?: unknown;
    };

    const updates: {
      name?: string;
      emoji?: string | null;
      isPublic?: boolean;
      createdAt?: Date | string;
    } = {};

    if (isPublic !== undefined) {
      if (typeof isPublic !== "boolean") {
        return NextResponse.json(
          { error: "isPublic must be a boolean" },
          { status: 400 },
        );
      }
      updates.isPublic = isPublic;
    }
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

    if (createdAt !== undefined) {
      if (typeof createdAt !== "string" || !createdAt.trim()) {
        return NextResponse.json(
          { error: "createdAt must be a non-empty ISO string when provided" },
          { status: 400 },
        );
      }
      updates.createdAt = createdAt.trim();
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No updates provided" },
        { status: 400 },
      );
    }

    const updated = await updateFolder(folderId, updates, access);
    return NextResponse.json(
      access.isAnonymous ? { ...updated, guest: true } : updated,
    );
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
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const access = dataAccessFromAuth(authResult);
  try {
    const { id: folderId } = await params;
    if (!access.isAnonymous) {
      const folder = await getFolderById(folderId, access);
      if (!folder) {
        return NextResponse.json(
          { error: "Folder not found" },
          { status: 404 },
        );
      }
    }
    await deleteFolder(folderId, access);
    if (access.isAnonymous) {
      return NextResponse.json({
        id: folderId,
        deleted: true,
        guest: true,
      });
    }
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete folder" },
      { status: 500 },
    );
  }
}
