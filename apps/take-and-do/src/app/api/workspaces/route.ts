import { NextResponse } from "next/server";
import { getAllFolders, getAllTaskBoards } from "@/db/queries";

export async function GET() {
  try {
    const [folders, taskBoards] = await Promise.all([
      getAllFolders(),
      getAllTaskBoards(),
    ]);

    return NextResponse.json({ folders, taskBoards });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch workspaces" },
      { status: 500 },
    );
  }
}
