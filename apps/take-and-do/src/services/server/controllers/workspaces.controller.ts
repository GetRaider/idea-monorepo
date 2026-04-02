import { getAccessByAuth, requireAuth } from "@/auth/guards";
import { WorkspacesResponseDto } from "@/db/dtos";
import { apiServices } from "@/services/server/api";

import { BaseController } from "./base.controller";

export class WorkspacesController extends BaseController {
  get = this.createRoute({
    responseDto: WorkspacesResponseDto,
    handler: async (_req, _body, _ctx) => {
      const auth = await requireAuth();
      const access = getAccessByAuth(auth);
      const [folders, taskBoards] = await Promise.all([
        apiServices.folders.getAll(access),
        apiServices.taskBoards.getAll(access),
      ]);
      return { folders, taskBoards };
    },
  });
}
