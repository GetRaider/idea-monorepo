import { config } from "@repo/eslint-config/base";
import { globalIgnores } from "eslint/config";
import globals from "globals";

export default [
  globalIgnores(["out/**", "dist/**", "coverage/**"]),
  ...config,
  {
    files: [
      "src/main/**/*.ts",
      "src/preload/**/*.ts",
      "electron.vite.config.ts",
    ],
    languageOptions: {
      globals: globals.node,
    },
  },
];
