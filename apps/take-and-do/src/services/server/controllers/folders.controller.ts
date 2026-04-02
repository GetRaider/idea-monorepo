import { NextResponse } from "next/server";
import { z } from "zod";

import { getAccessByAuth, requireAuth } from "@/auth/guards";
import {
  CreateFolderDto,
  FolderResponseDto,
  FoldersListResponseDto,
  GuestResourceDeleteResponseDto,
  UpdateFolderDto,
} from "@/db/dtos";
import { BadRequestError, NotFoundError } from "@/lib/api/errors";
import { apiServices } from "@/services/server/api";

import { BaseController, InputType } from "./base.controller";

const folderIdParamsSchema = z.object({ id: z.string() });

const folderUpdateRequestSchema = z.intersection(
  folderIdParamsSchema,
  UpdateFolderDto,
);

export class FoldersController extends BaseController {
  list = this.createRoute({
    responseDto: FoldersListResponseDto,
    handler: async () => {
      const auth = await requireAuth();
      const access = getAccessByAuth(auth);
      return apiServices.folders.getAll(access);
    },
  });

  create = this.createRoute({
    requestDto: CreateFolderDto,
    responseDto: FolderResponseDto,
    inputType: InputType.Body,
    status: 201,
    handler: async ({ input }) => {
      const auth = await requireAuth();
      const access = getAccessByAuth(auth);
      const folder = await apiServices.folders.create(
        input.name.trim(),
        access,
        input.emoji,
      );
      return access.isAnonymous ? { ...folder, guest: true as const } : folder;
    },
  });

  getById = this.createRoute({
    requestDto: folderIdParamsSchema,
    inputType: InputType.Params,
    responseDto: FolderResponseDto,
    handler: async ({ input }) => {
      const auth = await requireAuth();
      const access = getAccessByAuth(auth);
      const folder = await apiServices.folders.getById(input.id, access);
      if (!folder) throw new NotFoundError("Folder");
      return folder;
    },
  });

  update = this.createRoute({
    responseDto: FolderResponseDto,
    handler: async ({ request, context }) => {
      const auth = await requireAuth();
      const access = getAccessByAuth(auth);
      const params = await Promise.resolve(context.params);
      const idRecord = folderIdParamsSchema.parse(params);
      const json = await request.json();
      const body = folderUpdateRequestSchema.parse({ ...idRecord, ...json });
      const { id: folderId, ...updates } = body;

      if (Object.keys(updates).length === 0)
        throw new BadRequestError("No updates provided");

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
    requestDto: folderIdParamsSchema,
    inputType: InputType.Params,
    responseDto: GuestResourceDeleteResponseDto,
    handler: async ({ input }) => {
      const auth = await requireAuth();
      const access = getAccessByAuth(auth);
      const folderId = input.id;

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
