/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ['@repo/eslint-config/next'],
  parserOptions: {
    project: true,
  },
};
