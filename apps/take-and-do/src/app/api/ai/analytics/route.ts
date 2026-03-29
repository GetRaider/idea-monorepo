import { NextRequest, NextResponse } from "next/server";

import { requireAiAccess } from "@/lib/api-auth";
import { aiServices } from "@/services/ai";

export async function POST(request: NextRequest) {
  const authResult = await requireAiAccess();
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const result = await aiServices.analytics.generate(body);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to generate analytics", details: message },
      { status: 500 },
    );
  }
}
