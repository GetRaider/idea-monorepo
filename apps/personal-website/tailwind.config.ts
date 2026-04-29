import type { Config } from "tailwindcss";

import uiPreset from "../../packages/ui/tailwind.preset";

const config: Config = {
  presets: [uiPreset as Config],
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      keyframes: {
        "marquee-left": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translate(0, 0)" },
          "33%": { transform: "translate(8px, -18px)" },
          "66%": { transform: "translate(-10px, 6px)" },
        },
        drift: {
          "0%, 100%": { transform: "translate(0, 0) rotate(0deg)" },
          "50%": { transform: "translate(-4%, 3%) rotate(2deg)" },
        },
        "aurora-pulse": {
          "0%, 100%": { opacity: "0.5", transform: "scale(1)" },
          "50%": { opacity: "0.85", transform: "scale(1.08)" },
        },
        "glow-orbit": {
          "0%": { transform: "rotate(0deg) translateX(120px) rotate(0deg)" },
          "100%": {
            transform: "rotate(360deg) translateX(120px) rotate(-360deg)",
          },
        },
        "scan-line": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "marquee-left": "marquee-left 24s linear infinite",
        float: "float 8s ease-in-out infinite",
        "float-slow": "float-slow 14s ease-in-out infinite",
        drift: "drift 18s ease-in-out infinite",
        "aurora-pulse": "aurora-pulse 10s ease-in-out infinite",
        "glow-orbit": "glow-orbit 22s linear infinite",
        "scan-line": "scan-line 4.5s ease-in-out infinite alternate",
      },
    },
  },
  plugins: [],
};

export default config;
