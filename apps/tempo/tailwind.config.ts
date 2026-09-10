import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/renderer/src/**/*.{ts,tsx}"],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        tempo: {
          bg: "var(--tempo-bg)",
          panel: "var(--tempo-panel)",
          line: "var(--tempo-line)",
          "line-2": "var(--tempo-line-2)",
          text: "var(--tempo-text)",
          muted: "var(--tempo-muted)",
          faint: "var(--tempo-faint)",
          accent: "var(--tempo-accent)",
          "accent-wash": "var(--tempo-accent-wash)",
          live: "var(--tempo-live)",
          "on-primary": "var(--tempo-on-primary)",
          danger: "var(--tempo-danger)",
        },
      },
      fontFamily: {
        sans: ['"Inter Tight"', "system-ui", "sans-serif"],
        display: ['"Bricolage Grotesque"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
