import { z } from "zod";
import { BaseController } from "./base/base.controller";

import {
  deleteWord,
  updateTranslation,
  type VocabularyWord,
} from "@/server/services/vocabulary/vocabulary.service";

const paramsSchema = z.object({
  id: z.string().min(1),
});

const patchBodySchema = z.object({
  translation: z.string().min(1),
});

export class VocabularyItemController extends BaseController {
  patchTranslation = this.initRoute({
    paramsDto: paramsSchema,
    bodyDto: patchBodySchema,
    handler: async ({ params, body }) => {
      const result: VocabularyWord = await updateTranslation({
        id: params.id,
        translation: body.translation,
      });

      return result;
    },
  });

  delete = this.initRoute({
    paramsDto: paramsSchema,
    status: 204,
    handler: async ({ params }) => {
      await deleteWord({ id: params.id });
      return new Response(null, { status: 204 });
    },
  });
}

