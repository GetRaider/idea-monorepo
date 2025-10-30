import { NextResponse } from "next/server";
import { getAllFolders } from "@/app/api/mock-data";

export async function GET() {
  const folders = getAllFolders();

  return NextResponse.json(folders);
}
