import type { Config } from "tailwindcss";
import uiPreset from "@repo/ui/tailwind-preset";

const config: Config = {
  presets: [uiPreset],
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
