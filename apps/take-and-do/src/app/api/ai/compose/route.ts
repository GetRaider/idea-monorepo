import { NextRequest, NextResponse } from "next/server";
import { composeTask } from "@/lib/ai";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await composeTask(body);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to compose task", details: message },
      { status: 500 },
    );
  }
}



