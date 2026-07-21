import { z } from "zod";
import { BaseController } from "./base/base.controller";

import { getYouTubeTranscript } from "@/server/services/youtube/youtube-transcript.service";
import type { TranscriptResponse } from "@/server/services/youtube/youtube-transcript.service";

const paramsSchema = z.object({
  videoId: z.string().min(1),
});

const querySchema = z.object({
  lang: z.string().min(2).optional().default("en"),
});

export class TranscriptController extends BaseController {
  getTranscript = this.initRoute({
    paramsDto: paramsSchema,
    queryDto: querySchema,
    handler: async ({ params, query }) => {
      const result: TranscriptResponse = await getYouTubeTranscript({
        videoId: params.videoId,
        preferredLanguage: query.lang,
      });

      return result;
    },
  });
}

