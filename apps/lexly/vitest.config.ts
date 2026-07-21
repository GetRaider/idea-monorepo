import path from "node:path";

// vitest-only; Next typecheck sometimes can't resolve this plugin type metadata
// but Vitest runtime still works.
// @ts-expect-error vitest-only plugin; Next typecheck cannot resolve its types
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

