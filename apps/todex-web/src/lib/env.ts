import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url(),
  NEXT_PUBLIC_TODEX_AUTH_DISABLED: z.enum(["true", "false"]).optional(),
});

const parsedEnv = envSchema.parse({
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_TODEX_AUTH_DISABLED:
    process.env.NEXT_PUBLIC_TODEX_AUTH_DISABLED,
});

export const env = {
  api: {
    baseUrl: parsedEnv.NEXT_PUBLIC_API_BASE_URL,
  },
  auth: {
    disabled: isAuthDisabled(
      parsedEnv.NEXT_PUBLIC_TODEX_AUTH_DISABLED,
      process.env.NODE_ENV,
    ),
  },
};

function isAuthDisabled(
  flag: "true" | "false" | undefined,
  nodeEnv: string | undefined,
): boolean {
  if (flag === "true") return true;
  if (flag === "false") return false;
  return nodeEnv !== "production";
}
