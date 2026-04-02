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
    requestDto: CreateLabelDto,
    inputType: InputType.Body,
    responseDto: LabelMutationResponseDto,
    status: 201,
    handler: async ({ input }) => {
      await requireNonAnonymous();
      const newLabel = await apiServices.labels.add(input.label.trim());
      return { label: newLabel };
    },
  });

  rename = this.createRoute({
    requestDto: RenameLabelDto,
    inputType: InputType.Body,
    responseDto: LabelMutationResponseDto,
    handler: async ({ input }) => {
      await requireNonAnonymous();
      const label = await apiServices.labels.rename(
        input.oldName.trim(),
        input.newName,
      );
      return { label };
    },
  });

  remove = this.createRoute({
    requestDto: DeleteLabelDto,
    inputType: InputType.Body,
    responseDto: OkTrueResponseDto,
    handler: async ({ input }) => {
      await requireNonAnonymous();
      await apiServices.labels.delete(input.name);
      return { ok: true };
    },
  });
}
