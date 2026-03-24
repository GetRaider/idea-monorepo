import { NextResponse } from "next/server";

import { dataAccessFromAuth, requireAuth } from "@/lib/api-auth";
import { getAllFolders, getAllTaskBoards } from "@/lib/db/queries";

export async function GET() {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const access = dataAccessFromAuth(authResult);
  try {
    const [folders, taskBoards] = await Promise.all([
      getAllFolders(access),
      getAllTaskBoards(access),
    ]);

    return NextResponse.json({ folders, taskBoards });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch workspaces" },
      { status: 500 },
    );
  }
}
