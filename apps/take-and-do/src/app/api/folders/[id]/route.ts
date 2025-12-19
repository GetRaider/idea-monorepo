import { NextRequest, NextResponse } from "next/server";
import { getFolderById } from "@/db/queries";

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
