import { NextRequest, NextResponse } from "next/server";

import { requireAuth, requireNonAnonymous } from "@/auth/guards";
import { apiServices } from "@/services/api";
import { handleRoute } from "@/lib/api/handleRoute";
import { CreateLabelDto, DeleteLabelDto, RenameLabelDto } from "@/db/dtos";

export const GET = handleRoute(async () => {
  await requireAuth();
  const labels = await apiServices.labels.getAll();
  return NextResponse.json(labels);
});

export const POST = handleRoute(async (request: NextRequest) => {
  await requireNonAnonymous();
  const { label } = CreateLabelDto.parse(await request.json());
  const newLabel = await apiServices.labels.add(label.trim());
  return NextResponse.json({ label: newLabel }, { status: 201 });
});

export const PATCH = handleRoute(async (request: NextRequest) => {
  await requireNonAnonymous();
  const { oldName, newName } = RenameLabelDto.parse(await request.json());
  const label = await apiServices.labels.rename(oldName.trim(), newName);
  return NextResponse.json({ label });
});

export const DELETE = handleRoute(async (request: NextRequest) => {
  await requireNonAnonymous();
  const { name } = DeleteLabelDto.parse(await request.json());
  await apiServices.labels.delete(name);
  return NextResponse.json({ ok: true });
});
