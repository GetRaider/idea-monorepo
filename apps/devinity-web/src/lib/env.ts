import { z } from "zod";

const envConfig = {
  // NEXT_PUBLIC_ vars should be explicitly set
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  ...process.env,
};

const envSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url(),
});

const parsedEnv = envSchema.parse(envConfig);

export const env = {
  api: {
    baseUrl: parsedEnv.NEXT_PUBLIC_API_BASE_URL,
  },
};
