import { FlatCompat } from "@eslint/eslintrc";
import { globalIgnores } from "eslint/config";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

const eslintConfig = [
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
