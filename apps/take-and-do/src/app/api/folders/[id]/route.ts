import { NextRequest, NextResponse } from "next/server";
import { getFolderById } from "@/app/api/mock-data";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: folderId } = await params;

  const folder = getFolderById(folderId);

  if (!folder) {
    return NextResponse.json({ error: "Folder not found" }, { status: 404 });
  }

  return NextResponse.json(folder);
}
