import { nestJsConfig } from "@repo/eslint-config/nest-js";

export default [
  ...nestJsConfig,
  {
    ignores: ["dist/**", "drizzle/**"],
  },
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
];
