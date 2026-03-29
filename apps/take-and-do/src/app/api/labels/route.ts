import { NextRequest, NextResponse } from "next/server";

import { requireAuth, requireNonAnonymous } from "@/lib/api-auth";
import {
  getAllLabels,
  addLabel,
  renameLabel,
  deleteLabelByName,
} from "@/lib/db/queries";

export async function GET() {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  try {
    const labels = await getAllLabels();
    return NextResponse.json(labels);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch labels" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireNonAnonymous();
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { label } = await request.json();

    if (!label || typeof label !== "string") {
      return NextResponse.json({ error: "Label is required" }, { status: 400 });
    }

    const newLabel = await addLabel(label.trim());
    return NextResponse.json({ label: newLabel }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create label" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const authResult = await requireNonAnonymous();
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const oldName = body?.oldName;
    const newName = body?.newName;

    if (typeof oldName !== "string" || typeof newName !== "string") {
      return NextResponse.json(
        { error: "oldName and newName are required" },
        { status: 400 },
      );
    }

    const label = await renameLabel(oldName.trim(), newName);
    return NextResponse.json({ label });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to rename label";
    if (message === "Label not found") {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    if (message === "A label with that name already exists") {
      return NextResponse.json({ error: message }, { status: 409 });
    }
    if (message === "Label name is required") {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to rename label" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const authResult = await requireNonAnonymous();
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const name = body?.name;

    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    await deleteLabelByName(name);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete label" },
      { status: 500 },
    );
  }
}
