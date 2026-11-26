import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      maxWidth: {
        page: "1120px",
      },
      colors: {
        ink: { DEFAULT: "var(--ink)", raised: "var(--ink-raised)" },
        ember: { DEFAULT: "var(--ember)", strong: "var(--ember-strong)" },
        cream: "var(--cream)",
        mist: "var(--mist)",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        marquee: "marquee 28s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
