import { resolve } from "node:path";

import { defineConfig, externalizeDepsPlugin } from "electron-vite";

export default defineConfig({
  main: { plugins: [externalizeDepsPlugin()] },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        output: { format: "cjs", entryFileNames: "[name].js" },
      },
    },
  },
  renderer: {
    build: {
      rollupOptions: {
        input: resolve("src/renderer/stack-down.html"),
      },
    },
  },
});
