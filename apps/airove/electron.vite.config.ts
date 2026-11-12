import { resolve } from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";

export default defineConfig({
  main: { plugins: [externalizeDepsPlugin()] },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: { output: { format: "cjs", entryFileNames: "[name].js" } },
    },
  },
  renderer: {
    worker: { format: "es" },
    resolve: {
      alias: {
        "@huggingface/transformers": resolve(
          "node_modules/@huggingface/transformers/dist/transformers.web.js",
        ),
      },
    },
    optimizeDeps: { exclude: ["onnxruntime-node", "sharp"] },
    plugins: [
      react(),
      {
        name: "airove-development-csp",
        apply: "serve",
        transformIndexHtml(html) {
          return html
            .replace("script-src 'self'", "script-src 'self' 'unsafe-inline'")
            .replace("style-src 'self'", "style-src 'self' 'unsafe-inline'");
        },
      },
    ],
  },
});
