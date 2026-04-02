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
  list = this.createRoute({
    responseDto: LabelsListResponseDto,
    handler: async (_req, _body, _ctx) => {
      await requireAuth();
      return apiServices.labels.getAll();
    },
  });

  create = this.createRoute({
    requestDto: CreateLabelDto,
    responseDto: LabelMutationResponseDto,
    jsonStatus: 201,
    handler: async (_req, body, _ctx) => {
      await requireNonAnonymous();
      const newLabel = await apiServices.labels.add(body.label.trim());
      return { label: newLabel };
    },
  });

  rename = this.createRoute({
    requestDto: RenameLabelDto,
    responseDto: LabelMutationResponseDto,
    handler: async (_req, body, _ctx) => {
      await requireNonAnonymous();
      const label = await apiServices.labels.rename(
        body.oldName.trim(),
        body.newName,
      );
      return { label };
    },
  });

  remove = this.createRoute({
    requestDto: DeleteLabelDto,
    responseDto: OkTrueResponseDto,
    handler: async (_req, body, _ctx) => {
      await requireNonAnonymous();
      await apiServices.labels.delete(body.name);
      return { ok: true };
    },
  });
}
