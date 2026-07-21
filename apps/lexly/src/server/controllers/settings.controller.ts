import { z } from "zod";
import { BaseController } from "./base/base.controller";

import {
  getSettings,
  updateSettings,
  type LexlySettings,
} from "@/server/services/settings/settings.service";

import {
  supportedNativeLanguages,
  type NativeLanguage,
} from "@/server/services/dictionary/translation-stub";

const nativeLanguageEnum = z.enum(
  supportedNativeLanguages as [NativeLanguage, ...NativeLanguage[]],
);

const patchBodySchema = z.object({
  nativeLanguage: nativeLanguageEnum.optional(),
  playbackSpeedDefault: z
    .number()
    .min(0.5)
    .max(3)
    .optional(),
});

export class SettingsController extends BaseController {
  get = this.initRoute({
    handler: async () => {
      const result: LexlySettings = await getSettings();
      return result;
    },
  });

  patch = this.initRoute({
    bodyDto: patchBodySchema,
    handler: async ({ body }) => {
      const result: LexlySettings = await updateSettings(body);
      return result;
    },
  });
}

