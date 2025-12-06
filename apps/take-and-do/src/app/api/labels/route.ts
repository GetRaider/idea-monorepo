import { NextRequest, NextResponse } from "next/server";
import { getAllLabels, addLabel } from "@/app/api/mock-data";

export async function GET() {
  try {
    const labels = getAllLabels();
    return NextResponse.json(labels);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch labels" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { label } = await request.json();

    if (!label || typeof label !== "string") {
      return NextResponse.json(
        { error: "Label is required" },
        { status: 400 },
      );
    }

    const newLabel = addLabel(label.trim());
    return NextResponse.json({ label: newLabel }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create label" },
      { status: 500 },
    );
  }
}

