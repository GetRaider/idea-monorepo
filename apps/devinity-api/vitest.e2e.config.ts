import { defineConfig, mergeConfig } from "vitest/config";

import nestPreset from "@repo/vitest-config/nest";

export default mergeConfig(
  nestPreset,
  defineConfig({
    test: {
      include: ["test/**/*.e2e-spec.ts"],
      setupFiles: ["test/vitest-setup.ts"],
      testTimeout: 30_000,
      hookTimeout: 30_000,
    },
  }),
);
