import path from "node:path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.spec.ts"],
    coverage: {
      provider: "v8",
      reportsDirectory: "./coverage",
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.d.ts",
        "src/**/*.test.ts",
        "src/**/*.spec.ts",
        "src/**/index.ts",
      ],
    },
  },
  resolve: {
    alias: [
      {
        find: "@repo/shared",
        replacement: path.resolve(__dirname, "./src/index.ts"),
      },
      {
        find: /^@repo\/shared\/(.+)$/,
        replacement: `${path.resolve(__dirname, "./src")}/$1`,
      },
    ],
  },
});
