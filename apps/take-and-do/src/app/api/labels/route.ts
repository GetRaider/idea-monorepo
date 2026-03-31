import { NextRequest, NextResponse } from "next/server";

import { requireAuth, requireNonAnonymous } from "@/auth/guards";
import { apiServices } from "@/services/api";
import { defineRoute } from "@/lib/api/defineRoute";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "@/lib/api/errors";
import { CreateLabelDto, DeleteLabelDto, RenameLabelDto } from "@/db/dtos";

export const GET = defineRoute(async () => {
  await requireAuth();
  const labels = await apiServices.labels.getAll();
  return NextResponse.json(labels);
});

export const POST = defineRoute(async (request: NextRequest) => {
  await requireNonAnonymous();
  const { label } = CreateLabelDto.parse(await request.json());
  const newLabel = await apiServices.labels.add(label.trim());
  return NextResponse.json({ label: newLabel }, { status: 201 });
});

export const PATCH = defineRoute(async (request: NextRequest) => {
  await requireNonAnonymous();
  const { oldName, newName } = RenameLabelDto.parse(await request.json());
  try {
    const label = await apiServices.labels.rename(oldName.trim(), newName);
    return NextResponse.json({ label });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "Label not found") throw new NotFoundError("Label");
    if (message === "A label with that name already exists")
      throw new ConflictError(message);
    if (message === "Label name is required")
      throw new BadRequestError(message);
    throw error;
  }
});

export const DELETE = defineRoute(async (request: NextRequest) => {
  await requireNonAnonymous();
  const { name } = DeleteLabelDto.parse(await request.json());
  await apiServices.labels.delete(name);
  return NextResponse.json({ ok: true });
});
