import { NextRequest, NextResponse } from "next/server";
import { getAllFolders, createFolder } from "@/lib/db/queries";

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

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      if (error instanceof SyntaxError) {
        return NextResponse.json(
          { error: "Invalid JSON body" },
          { status: 400 },
        );
      }
      throw error;
    }
    const { name } = body as { name?: unknown };
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 },
      );
    }
    const folder = await createFolder(name.trim());
    return NextResponse.json(folder, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create folder" },
      { status: 500 },
    );
  }
}
