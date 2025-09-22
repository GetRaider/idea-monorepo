import { z } from "zod";
import { config } from "dotenv";
import { resolve } from "path";

loadEnvFile();

const envSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url(),
});

const processEnv = {
  // NEXT_PUBLIC_ vars should be explicitly set like this to avoid Zod errors
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  ...process.env,
};

const parsedEnv = envSchema.parse(processEnv);

export const env = {
  api: {
    baseUrl: parsedEnv.NEXT_PUBLIC_API_BASE_URL,
  },
};

function loadEnvFile(): void {
  let path: string | null = null;
  const nodeEnv = process.env.NODE_ENV || "development";
  const envFileName =
    nodeEnv === "production" ? ".env.production" : ".env.local";

  if (nodeEnv === "production") {
    // loads .env.production from root directory because it sets there on deployments
    const isInAppsDir = process.cwd().includes("/apps/devinity-web");
    const rootDir = isInAppsDir
      ? resolve(process.cwd(), "../../")
      : process.cwd();
    path = resolve(rootDir, envFileName);
  } else {
    // loads .env.local from current directory
    path = resolve(process.cwd(), envFileName);
  }

  config({ path });
}
