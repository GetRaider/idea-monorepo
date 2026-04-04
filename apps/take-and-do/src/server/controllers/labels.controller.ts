import { getAccessByAuth, requireAuth } from "@/auth/guards";
import {
  CreateLabelDto,
  DeleteLabelDto,
  LabelMutationResponseDto,
  LabelsListResponseDto,
  OkTrueResponseDto,
  RenameLabelDto,
} from "@/db/dtos";
import { apiServices } from "@/server/services/api";
import { BaseController } from "./base.controller";
import { NextResponse } from "next/server";

export class LabelsController extends BaseController {
  getAll = this.initRoute({
    responseDto: LabelsListResponseDto,
    handler: async () => {
      const auth = await requireAuth();
      const access = getAccessByAuth(auth);
      return apiServices.labels.getAll(access);
    },
  });

  create = this.initRoute({
    bodyDto: CreateLabelDto,
    responseDto: LabelMutationResponseDto,
    status: 201,
    handler: async ({ body: { label } }) => {
      const auth = await requireAuth();
      const access = getAccessByAuth(auth);
      return { label: await apiServices.labels.add(access, label.trim()) };
    },
  });

  rename = this.initRoute({
    bodyDto: RenameLabelDto,
    responseDto: LabelMutationResponseDto,
    handler: async ({ body }) => {
      const auth = await requireAuth();
      const access = getAccessByAuth(auth);
      const { oldName, newName } = body;
      return {
        label: await apiServices.labels.rename(access, oldName.trim(), newName),
      };
    },
  });

  delete = this.initRoute({
    bodyDto: DeleteLabelDto,
    responseDto: OkTrueResponseDto,
    handler: async ({ body }) => {
      const auth = await requireAuth();
      const access = getAccessByAuth(auth);
      await apiServices.labels.delete(access, body.name);
      return new NextResponse(null, { status: 204 });
    },
  });
}
