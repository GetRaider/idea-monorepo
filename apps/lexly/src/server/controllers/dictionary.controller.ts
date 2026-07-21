import { z } from "zod";
import { BaseController } from "./base/base.controller";

import { getDictionaryDetails } from "@/server/services/dictionary/dictionary.service";
import type { DictionaryDetails } from "@/server/services/dictionary/dictionary.service";
import {
  supportedNativeLanguages,
  type NativeLanguage,
} from "@/server/services/dictionary/translation-stub";

const paramsSchema = z.object({
  word: z.string().min(1),
});

const querySchema = z.object({
  nativeLanguage: z
    .enum(supportedNativeLanguages as [NativeLanguage, ...NativeLanguage[]])
    .optional()
    .default("uk"),
});

export class DictionaryController extends BaseController {
  getDictionary = this.initRoute({
    paramsDto: paramsSchema,
    queryDto: querySchema,
    handler: async ({ params, query }) => {
      const result: DictionaryDetails = await getDictionaryDetails({
        word: params.word,
        nativeLanguage: query.nativeLanguage,
      });

      return result;
    },
  });
}

