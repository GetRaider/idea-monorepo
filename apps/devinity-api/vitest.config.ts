import { defineConfig, mergeConfig } from "vitest/config";

import nestPreset from "@repo/vitest-config/nest";

export default mergeConfig(
  nestPreset,
  defineConfig({
    test: {
      include: ["src/**/*.spec.ts"],
      setupFiles: ["test/vitest-setup.ts"],
      passWithNoTests: true,
    },
  }),
);
