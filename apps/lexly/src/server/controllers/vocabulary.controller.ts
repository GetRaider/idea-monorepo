import { z } from "zod";
import { BaseController } from "./base/base.controller";

import {
  listVocabulary,
  saveWord,
  type VocabularyWord,
} from "@/server/services/vocabulary/vocabulary.service";

const querySchema = z.object({
  q: z.string().min(1).optional(),
  sourceYoutubeId: z.string().min(1).optional(),
});

const saveWordBodySchema = z.object({
  lemma: z.string().min(1),
  word: z.string().min(1),
  pronunciation: z.string().min(1).nullable().optional(),
  partOfSpeech: z.string().min(1).nullable().optional(),
  definition: z.string().min(1),
  translation: z.string().min(1),
  exampleSentence: z.string().min(1),
  sourceYoutubeId: z.string().min(1),
  sourceSentence: z.string().min(1),
});

export class VocabularyController extends BaseController {
  list = this.initRoute({
    queryDto: querySchema,
    handler: async ({ query }) => {
      const result: VocabularyWord[] = await listVocabulary({
        q: query.q,
        sourceYoutubeId: query.sourceYoutubeId,
      });

      return result;
    },
  });

  save = this.initRoute({
    bodyDto: saveWordBodySchema,
    status: 201,
    handler: async ({ body }) => {
      const result: VocabularyWord = await saveWord(body);
      return result;
    },
  });
}

