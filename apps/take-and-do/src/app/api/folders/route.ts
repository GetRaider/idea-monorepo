import { NextRequest, NextResponse } from "next/server";

import { getAccessByAuth, requireAuth } from "@/auth/guards";
import { apiServices } from "@/services/api";
import { defineRoute } from "@/lib/api/defineRoute";
import { CreateFolderDto } from "@/db/dtos";

export const GET = defineRoute(async () => {
  const auth = await requireAuth();
  const access = getAccessByAuth(auth);
  const folders = await apiServices.folders.getAll(access);
  return NextResponse.json(folders);
});

export const POST = defineRoute(async (request: NextRequest) => {
  const auth = await requireAuth();
  const access = getAccessByAuth(auth);
  const { name, emoji } = CreateFolderDto.parse(await request.json());
  const folder = await apiServices.folders.create(name.trim(), access, emoji);
  return NextResponse.json(
    access.isAnonymous ? { ...folder, guest: true } : folder,
    { status: 201 },
  );
});
