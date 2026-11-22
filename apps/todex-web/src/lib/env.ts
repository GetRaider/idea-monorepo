import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url(),
  NEXT_PUBLIC_TODEX_AUTH_DISABLED: z
    .string()
    .optional()
    .transform((value) => value?.toLowerCase() === "true"),
  NEXT_PUBLIC_TODEX_DEV_LOGIN: z
    .string()
    .optional()
    .transform((value) => value?.toLowerCase() === "true"),
});

const parsedEnv = envSchema.parse({
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_TODEX_AUTH_DISABLED: process.env.NEXT_PUBLIC_TODEX_AUTH_DISABLED,
  NEXT_PUBLIC_TODEX_DEV_LOGIN: process.env.NEXT_PUBLIC_TODEX_DEV_LOGIN,
});

export const env = {
  api: {
    baseUrl: parsedEnv.NEXT_PUBLIC_API_BASE_URL,
  },
  auth: {
    enabled: !parsedEnv.NEXT_PUBLIC_TODEX_AUTH_DISABLED,
    devLogin:
      parsedEnv.NEXT_PUBLIC_TODEX_DEV_LOGIN === true &&
      process.env.NODE_ENV !== "production",
  },
};
