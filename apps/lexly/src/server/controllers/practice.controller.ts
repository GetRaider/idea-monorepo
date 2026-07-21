import { z } from "zod";
import { BaseController } from "./base/base.controller";

import {
  getPracticeSession,
  reviewCard,
  getPracticeSummary,
  type PracticeCard,
  type PracticeSummary,
  type PracticeDirection,
} from "@/server/services/practice/srs-scheduler.service";

const directionSchema = z.enum([
  "en-to-native",
  "native-to-en",
]);

const reviewBodySchema = z.object({
  wordId: z.string().min(1),
  rating: z.enum(["again", "hard", "good", "easy"]),
});

export class PracticeController extends BaseController {
  session = this.initRoute({
    queryDto: z.object({
      direction: directionSchema.optional().default("en-to-native"),
    }),
    handler: async ({ query }) => {
      const result: PracticeCard[] = await getPracticeSession({
        direction: query.direction as PracticeDirection,
      });

      return result;
    },
  });

  reviews = this.initRoute({
    bodyDto: reviewBodySchema,
    status: 200,
    handler: async ({ body }) => {
      await reviewCard({ wordId: body.wordId, rating: body.rating });
      return new Response(null, { status: 200 });
    },
  });

  summary = this.initRoute({
    handler: async () => {
      const result: PracticeSummary = await getPracticeSummary();
      return result;
    },
  });
}

