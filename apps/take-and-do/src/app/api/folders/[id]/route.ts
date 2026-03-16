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
    const body = await request.json();
    const { name } = body;
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 },
      );
    }
    const updated = await updateFolder(folderId, { name: name.trim() });
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
