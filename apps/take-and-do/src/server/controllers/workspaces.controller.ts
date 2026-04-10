import { getAccessByAuth, requireAuth } from "@/auth/guards";
import { WorkspacesResponseDto } from "@/db/dtos";
import { apiServices } from "@/server/services/api";

import { BaseController } from "./base.controller";

export class WorkspacesController extends BaseController {
  get = this.initRoute({
    responseDto: WorkspacesResponseDto,
    handler: async () => {
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
