/** @type {import("@commitlint/types").UserConfig} */
module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "test", "chore", "docs", "refactor", "style"],
    ],
    "scope-enum": [2, "always", ["GEN", "TAD", "DVN", "PRT"]],
    "scope-empty": [2, "never"],
    "header-max-length": [2, "always", 60],
    "body-empty": [2, "always"],
    "footer-empty": [2, "always"],
  },
};
