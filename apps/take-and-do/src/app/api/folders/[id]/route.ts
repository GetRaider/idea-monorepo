import { NextRequest, NextResponse } from "next/server";

import { getAccessByAuth, requireAuth } from "@/auth/guards";
import { foldersApiService } from "@/services/api";
import { defineRoute } from "@/lib/api/defineRoute";
import { BadRequestError, NotFoundError } from "@/lib/api/errors";
import { UpdateFolderDto } from "@/db/dtos";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = defineRoute(async (_request: NextRequest, context) => {
  const auth = await requireAuth();
  const access = getAccessByAuth(auth);
  const { id: folderId } = await (context as RouteContext).params;
  const folder = await foldersApiService.getById(folderId, access);
  if (!folder) throw new NotFoundError("Folder");
  return NextResponse.json(folder);
});

export const PATCH = defineRoute(async (request: NextRequest, context) => {
  const auth = await requireAuth();
  const access = getAccessByAuth(auth);
  const { id: folderId } = await (context as RouteContext).params;
  const body = UpdateFolderDto.parse(await request.json());

  if (Object.keys(body).length === 0)
    throw new BadRequestError("No updates provided");

  if (!access.isAnonymous) {
    const folder = await foldersApiService.getById(folderId, access);
    if (!folder) throw new NotFoundError("Folder");
  }

  const updated = await foldersApiService.update(folderId, body, access);
  return NextResponse.json(
    access.isAnonymous ? { ...updated, guest: true } : updated,
  );
});

export const DELETE = defineRoute(async (_request: NextRequest, context) => {
  const auth = await requireAuth();
  const access = getAccessByAuth(auth);
  const { id: folderId } = await (context as RouteContext).params;

  if (!access.isAnonymous) {
    const folder = await foldersApiService.getById(folderId, access);
    if (!folder) throw new NotFoundError("Folder");
  }

  await foldersApiService.delete(folderId, access);

  if (access.isAnonymous) {
    return NextResponse.json({ id: folderId, deleted: true, guest: true });
  }
  return new NextResponse(null, { status: 204 });
});
