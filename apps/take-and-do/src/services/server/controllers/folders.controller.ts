import { NextResponse } from "next/server";

import { getAccessByAuth, requireAuth } from "@/auth/guards";
import {
  CreateFolderDto,
  FolderByIdRequestDto,
  FolderResponseDto,
  FoldersListResponseDto as GetAllFoldersResponseDto,
  GuestResourceDeleteResponseDto,
  UpdateFolderRequestDto,
} from "@/db/dtos";
import { BadRequestError, NotFoundError } from "@/lib/api/errors";
import { apiServices } from "@/services/server/api";

import { BaseController } from "./base.controller";

export class FoldersController extends BaseController {
  getAll = this.createRoute({
    responseDto: GetAllFoldersResponseDto,
    handler: async () => {
      const auth = await requireAuth();
      const access = getAccessByAuth(auth);
      return apiServices.folders.getAll(access);
    },
  });

  create = this.createRoute({
    bodyDto: CreateFolderDto,
    responseDto: FolderResponseDto,
    status: 201,
    handler: async ({ body }) => {
      const auth = await requireAuth();
      const access = getAccessByAuth(auth);
      const { name, emoji = null } = body;
      const folder = await apiServices.folders.create(
        name.trim(),
        access,
        emoji,
      );
      return access.isAnonymous ? { ...folder, guest: true as const } : folder;
    },
  });

  getById = this.createRoute({
    paramsDto: FolderByIdRequestDto,
    responseDto: FolderResponseDto,
    handler: async ({ params }) => {
      const auth = await requireAuth();
      const access = getAccessByAuth(auth);
      const folder = await apiServices.folders.getById(params.id, access);
      if (!folder) throw new NotFoundError("Folder");
      return folder;
    },
  });

  update = this.createRoute({
    bodyDto: UpdateFolderRequestDto,
    responseDto: FolderResponseDto,
    handler: async ({ body }) => {
      const auth = await requireAuth();
      const access = getAccessByAuth(auth);
      const { id: folderId, ...updates } = body;

      if (Object.keys(updates).length === 0) {
        throw new BadRequestError("No updates provided");
      }

      if (!access.isAnonymous) {
        const folder = await apiServices.folders.getById(folderId, access);
        if (!folder) throw new NotFoundError("Folder");
      }

      const updated = await apiServices.folders.update(
        folderId,
        updates,
        access,
      );
      return access.isAnonymous
        ? { ...updated, guest: true as const }
        : updated;
    },
  });

  delete = this.createRoute({
    paramsDto: FolderByIdRequestDto,
    responseDto: GuestResourceDeleteResponseDto,
    handler: async ({ params }) => {
      const auth = await requireAuth();
      const access = getAccessByAuth(auth);
      const folderId = params.id;

      if (!access.isAnonymous) {
        const folder = await apiServices.folders.getById(folderId, access);
        if (!folder) throw new NotFoundError("Folder");
      }

      await apiServices.folders.delete(folderId, access);

      if (access.isAnonymous) {
        return { id: folderId, deleted: true, guest: true };
      }
      return new NextResponse(null, { status: 204 });
    },
  });
}
