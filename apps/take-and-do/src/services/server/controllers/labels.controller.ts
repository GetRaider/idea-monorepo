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

import { BaseController, InputType } from "./base.controller";

export class LabelsController extends BaseController {
  list = this.createRoute({
    responseDto: LabelsListResponseDto,
    handler: async () => {
      await requireAuth();
      return apiServices.labels.getAll();
    },
  });

  create = this.createRoute({
    inputType: InputType.Body,
    requestDto: CreateLabelDto,
    responseDto: LabelMutationResponseDto,
    status: 201,
    handler: async ({ input: body }) => {
      await requireNonAnonymous();
      return { label: await apiServices.labels.add(body.label.trim()) };
    },
  });

  rename = this.createRoute({
    inputType: InputType.Body,
    requestDto: RenameLabelDto,
    responseDto: LabelMutationResponseDto,
    handler: async ({ input: body }) => {
      await requireNonAnonymous();
      const { oldName, newName } = body;
      return {
        label: await apiServices.labels.rename(oldName.trim(), newName),
      };
    },
  });

  remove = this.createRoute({
    inputType: InputType.Body,
    requestDto: DeleteLabelDto,
    responseDto: OkTrueResponseDto,
    handler: async ({ input: body }) => {
      await requireNonAnonymous();
      await apiServices.labels.delete(body.name);
      return { ok: true };
    },
  });
}
