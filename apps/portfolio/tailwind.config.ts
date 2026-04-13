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
          "0%, 100%": {
            transform: "translateY(0) rotateX(12deg) rotateY(-8deg)",
          },
          "50%": {
            transform: "translateY(-12px) rotateX(10deg) rotateY(-6deg)",
          },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0) translateX(0) scale(1)" },
          "33%": { transform: "translateY(-20px) translateX(8px) scale(1.02)" },
          "66%": { transform: "translateY(8px) translateX(-12px) scale(0.98)" },
        },
        drift: {
          "0%, 100%": { transform: "translate(0, 0) rotate(0deg)" },
          "50%": { transform: "translate(-4%, 3%) rotate(2deg)" },
        },
        "aurora-pulse": {
          "0%, 100%": { opacity: "0.5", transform: "scale(1)" },
          "50%": { opacity: "0.85", transform: "scale(1.08)" },
        },
        "spin-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
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
        "spin-slow": "spin-slow 48s linear infinite",
        "glow-orbit": "glow-orbit 22s linear infinite",
        "scan-line": "scan-line 3.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
