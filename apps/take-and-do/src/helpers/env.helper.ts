import { env } from "@/env";

export function isProd() {
  return env.nodeEnv === "production";
}
