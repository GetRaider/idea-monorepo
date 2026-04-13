import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: z.string().min(1),
  NEXT_PUBLIC_MIXPANEL_TOKEN: z.string().optional(),
});

const parsedEnv = envSchema.parse({
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  NEXT_PUBLIC_MIXPANEL_TOKEN: process.env.NEXT_PUBLIC_MIXPANEL_TOKEN,
});

export const env = {
  mixpanelToken: parsedEnv.NEXT_PUBLIC_MIXPANEL_TOKEN,
  googleClientId: parsedEnv.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
};
