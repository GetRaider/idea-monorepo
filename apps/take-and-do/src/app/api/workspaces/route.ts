import { NextResponse } from "next/server";
import { Folder, TaskBoard } from "@/types/workspace";
import { getAllFolders, getAllTaskBoards } from "@/app/api/mock-data";

export async function GET() {
  // Return folders and task boards
  const response = {
    folders: getAllFolders(),
    taskBoards: getAllTaskBoards(),
  };

  return NextResponse.json(response);
}
