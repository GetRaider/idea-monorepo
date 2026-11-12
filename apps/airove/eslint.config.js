import { config } from "@repo/eslint-config/react-internal";
import { globalIgnores } from "eslint/config";
import globals from "globals";

export default [
  globalIgnores([
    "out/**",
    "release/**",
    "dist/**",
    "coverage/**",
    "scripts/**",
  ]),
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
