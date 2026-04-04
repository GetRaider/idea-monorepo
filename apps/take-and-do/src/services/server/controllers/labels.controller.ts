import { requireAuth, requireNonAnonymous } from "@/auth/guards";
import {
  CreateLabelDto,
  DeleteLabelDto,
  LabelMutationResponseDto,
  LabelsListResponseDto,
  OkTrueResponseDto,
  RenameLabelDto,
} from "@/db/dtos";
import { apiServices } from "@/services/server/api";
import { BaseController } from "./base.controller";

export class LabelsController extends BaseController {
  list = this.initRoute({
    responseDto: LabelsListResponseDto,
    handler: async () => {
      await requireAuth();
      return apiServices.labels.getAll();
    },
  });

  create = this.initRoute({
    bodyDto: CreateLabelDto,
    responseDto: LabelMutationResponseDto,
    status: 201,
    handler: async ({ body: { label } }) => {
      await requireNonAnonymous();
      return { label: await apiServices.labels.add(label.trim()) };
    },
  });

  rename = this.initRoute({
    bodyDto: RenameLabelDto,
    responseDto: LabelMutationResponseDto,
    handler: async ({ body }) => {
      await requireNonAnonymous();
      const { oldName, newName } = body;
      return {
        label: await apiServices.labels.rename(oldName.trim(), newName),
      };
    },
  });

  remove = this.initRoute({
    bodyDto: DeleteLabelDto,
    responseDto: OkTrueResponseDto,
    handler: async ({ body }) => {
      await requireNonAnonymous();
      await apiServices.labels.delete(body.name);
      return { ok: true };
    },
  });
}
