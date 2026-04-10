import path from "node:path";

import { defineConfig, mergeConfig } from "vitest/config";

import nextPreset from "@repo/vitest-config/next";

export default mergeConfig(
  nextPreset,
  defineConfig({
    resolve: {
      alias: {
        "@components": path.resolve(__dirname, "./src/components"),
        "@hooks": path.resolve(__dirname, "./src/hooks"),
        "@lib": path.resolve(__dirname, "./src/lib"),
      },
    },
    test: {
      passWithNoTests: true,
      setupFiles: ["./vitest.setup.ts"],
    },
  }),
);
