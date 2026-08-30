import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/renderer/src/**/*.{ts,tsx}"],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
