import { BaseController } from "./base/base.controller";

import { getProgress, type ProgressResponse } from "@/server/services/progress/progress.service";

export class ProgressController extends BaseController {
  get = this.initRoute({
    handler: async () => {
      const result: ProgressResponse = await getProgress();
      return result;
    },
  });
}

