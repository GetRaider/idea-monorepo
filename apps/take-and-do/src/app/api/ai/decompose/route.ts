import { NextRequest, NextResponse } from "next/server";
import { aiServices } from "@/services/ai";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await aiServices.task.decompose(body);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to decompose task", details: message },
      { status: 500 },
    );
  }
}
