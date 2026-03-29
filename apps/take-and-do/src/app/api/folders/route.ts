import { NextRequest, NextResponse } from "next/server";

import {
  dataAccessFromAuth,
  requireAuth,
  requireNonAnonymous,
} from "@/lib/api-auth";
import { getAllFolders, createFolder } from "@/lib/db/queries";

export async function GET() {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const access = dataAccessFromAuth(authResult);
  try {
    const folders = await getAllFolders(access);
    return NextResponse.json(folders);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch folders" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireNonAnonymous();
  if (authResult instanceof NextResponse) return authResult;

  const access = dataAccessFromAuth(authResult);
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
    const { name, emoji } = body as {
      name?: unknown;
      emoji?: unknown;
    };
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    let emojiValue: string | null | undefined;
    if (emoji !== undefined) {
      if (emoji === null) emojiValue = null;
      else if (typeof emoji === "string") {
        const t = emoji.trim();
        emojiValue = t || null;
      } else {
        return NextResponse.json(
          { error: "emoji must be a string or null" },
          { status: 400 },
        );
      }
    }
    const folder = await createFolder(name.trim(), access, emojiValue);
    return NextResponse.json(folder, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create folder" },
      { status: 500 },
    );
  }
}
