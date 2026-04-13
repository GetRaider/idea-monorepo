import type { Config } from "tailwindcss";

/**
 * Extend from this preset in app `tailwind.config` so classes used in @repo/ui
 * components are generated.
 */
const preset: Partial<Config> = {
  theme: {
    extend: {},
  },
};

export default preset;
