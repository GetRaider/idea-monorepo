import { NextResponse } from "next/server";

import { getAccessByAuth, requireRegistered } from "@/auth/guards";
import {
  CreateFolderDto,
  FolderByIdRequestDto,
  FolderResponseDto,
  FoldersListResponseDto as GetAllFoldersResponseDto,
  UpdateFolderRequestDto,
} from "@/db/dtos";
import { BadRequestError, NotFoundError } from "@/lib/api/errors";
import { apiServices } from "@/server/services/api";
import { BaseController } from "./base/base.controller";

export class FoldersController extends BaseController {
  getAll = this.initRoute({
    responseDto: GetAllFoldersResponseDto,
    handler: async () => {
      const auth = await requireRegistered();
      const access = getAccessByAuth(auth);
      return apiServices.folders.getAll(access);
    },
  });

  create = this.initRoute({
    bodyDto: CreateFolderDto,
    responseDto: FolderResponseDto,
    status: 201,
    handler: async ({ body }) => {
      const auth = await requireRegistered();
      const access = getAccessByAuth(auth);
      const { name, emoji = null } = body;
      return apiServices.folders.create(name.trim(), access, emoji);
    },
  });

  getById = this.initRoute({
    paramsDto: FolderByIdRequestDto,
    responseDto: FolderResponseDto,
    handler: async ({ params }) => {
      const auth = await requireRegistered();
      const access = getAccessByAuth(auth);
      const folder = await apiServices.folders.getById(params.id, access);
      if (!folder) throw new NotFoundError("Folder");
      return folder;
    },
  });

  update = this.initRoute({
    bodyDto: UpdateFolderRequestDto,
    responseDto: FolderResponseDto,
    handler: async ({ body }) => {
      const auth = await requireRegistered();
      const access = getAccessByAuth(auth);
      const { id: folderId, ...updates } = body;

      if (Object.keys(updates).length === 0) {
        throw new BadRequestError("No updates provided");
      }

      const folder = await apiServices.folders.getById(folderId, access);
      if (!folder) throw new NotFoundError("Folder");

      return apiServices.folders.update(folderId, updates, access);
    },
  });

  delete = this.initRoute({
    paramsDto: FolderByIdRequestDto,
    handler: async ({ params }) => {
      const auth = await requireRegistered();
      const access = getAccessByAuth(auth);
      const folderId = params.id;

      const folder = await apiServices.folders.getById(folderId, access);
      if (!folder) throw new NotFoundError("Folder");

      await apiServices.folders.delete(folderId, access);
      return new NextResponse(null, { status: 204 });
    },
  });
}
