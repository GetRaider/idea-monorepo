import { NextResponse } from "next/server";
import { getAllFolders } from "@/db/queries";

export async function GET() {
  try {
    const folders = await getAllFolders();
    return NextResponse.json(folders);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch folders" },
      { status: 500 },
    );
  }
}
