---
paths:
  - "packages/eslint-config/**"
---

# @repo/eslint-config

Flat config, ESM (`"type": "module"`). Each file exports `config` (an array); consumers spread it in their `eslint.config.*`.

- Exports: `base`, `library`, `next` (alias `next-js`), `nest-js`, `react-internal`, `prettier-base`.
- `base`: `@eslint/js` recommended + `typescript-eslint` recommended + `eslint-config-prettier` + `turbo/no-undeclared-env-vars`.
- `eslint-plugin-only-warn` is enabled, so **every rule reports as a warning**. Don't rely on ESLint to fail anything; `pnpm codeCheck` (tsc) is the hard gate.
- `nest-js` turns off `no-explicit-any` and warns on `no-floating-promises` / `no-unsafe-argument`.
- New rules go in the narrowest config that needs them; don't add rules to `base` for one app.
- Add a new export to `package.json` `exports` when adding a config file.

## prettier-base

`prettier-base.cjs` must stay **CommonJS**. It is `require()`d from `.prettierrc.js` files, and an ESM `export default` is silently ignored by prettier. Quotes are double (`singleQuote: false`).
