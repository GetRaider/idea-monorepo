import { NextResponse } from "next/server";
import { getAllTaskBoards } from "@/app/api/mock-data";

export async function GET() {
  const taskBoards = getAllTaskBoards();

  return NextResponse.json(taskBoards);
}
