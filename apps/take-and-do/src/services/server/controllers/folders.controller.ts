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

import { BaseController } from "./base.controller";

const folderIdParamsSchema = z.object({ id: z.string() });

const folderUpdateRequestSchema = z.intersection(
  folderIdParamsSchema,
  UpdateFolderDto,
);

export class FoldersController extends BaseController {
  list = this.createRoute({
    responseDto: FoldersListResponseDto,
    handler: async (_req, _body, _ctx) => {
      const auth = await requireAuth();
      const access = getAccessByAuth(auth);
      return apiServices.folders.getAll(access);
    },
  });

  create = this.createRoute({
    requestDto: CreateFolderDto,
    responseDto: FolderResponseDto,
    jsonStatus: 201,
    handler: async (_req, body, _ctx) => {
      const auth = await requireAuth();
      const access = getAccessByAuth(auth);
      const folder = await apiServices.folders.create(
        body.name.trim(),
        access,
        body.emoji,
      );
      return access.isAnonymous ? { ...folder, guest: true as const } : folder;
    },
  });

  getById = this.createRoute({
    requestDto: folderIdParamsSchema,
    requestSource: async (_req, ctx) =>
      folderIdParamsSchema.parse(await ctx.params),
    responseDto: FolderResponseDto,
    handler: async (_req, params, _ctx) => {
      const auth = await requireAuth();
      const access = getAccessByAuth(auth);
      const folder = await apiServices.folders.getById(params.id, access);
      if (!folder) throw new NotFoundError("Folder");
      return folder;
    },
  });

  update = this.createRoute({
    requestDto: folderUpdateRequestSchema,
    requestSource: async (req, ctx) => ({
      ...(await folderIdParamsSchema.parse(await ctx.params)),
      ...(await req.json()),
    }),
    responseDto: FolderResponseDto,
    handler: async (_req, body, _ctx) => {
      const auth = await requireAuth();
      const access = getAccessByAuth(auth);
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
    requestSource: async (_req, ctx) =>
      folderIdParamsSchema.parse(await ctx.params),
    responseDto: GuestResourceDeleteResponseDto,
    handler: async (_req, params, _ctx) => {
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
