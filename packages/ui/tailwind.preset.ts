import type { Config } from "tailwindcss";

/**
 * Extend from this preset in app `tailwind.config` so classes used in @repo/ui
 * components are generated.
 */
const preset: Partial<Config> = {
  theme: {
    extend: {
      keyframes: {
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      animation: {
        "gradient-shift": "gradient-shift 15s ease infinite",
        "gradient-shift-fast": "gradient-shift 10s ease infinite",
      },
    },
  },
};

export default preset;
