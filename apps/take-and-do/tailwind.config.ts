import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
    "./src/pages/**/*.{ts,tsx}",
    "./node_modules/@tremor/**/*.{js,ts,jsx,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        "background-primary": "var(--background-primary)",
        "background-login": "var(--background-login)",
        foreground: "var(--foreground)",
        "sidebar-bg": "var(--sidebar-bg)",
        "nav-sidebar-bg": "var(--nav-sidebar-bg)",
        "border-app": "var(--border-color)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-tertiary": "var(--text-tertiary)",
        "accent-primary": "var(--accent-primary)",
        "accent-secondary": "var(--accent-secondary)",
        "input-bg": "var(--input-bg)",
        "input-border": "var(--input-border)",
        "input-border-hover": "var(--input-border-hover)",
        "input-login-bg": "var(--input-login-bg)",
        "input-login-border": "var(--input-login-border)",
        "input-login-border-hover": "var(--input-login-border-hover)",
        "focus-ring": "var(--focus-ring)",
        "brand-primary": "var(--brand-primary)",
        "brand-gradient-from": "var(--brand-gradient-from)",
        "brand-gradient-to": "var(--brand-gradient-to)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
      },
      boxShadow: {
        dialog: "var(--shadow-dialog)",
        dropdown: "var(--shadow-dropdown)",
      },
      maxWidth: {
        dialog: "var(--dialog-max-width)",
      },
      keyframes: {
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "segment-fill": {
          from: { opacity: "0.5", transform: "scaleX(0.95)" },
          to: { opacity: "1", transform: "scaleX(1)" },
        },
        shimmer: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
        "task-drop-in": {
          "0%": { opacity: "0", transform: "scale(0.97) translateY(-5px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
      },
      animation: {
        "gradient-shift": "gradient-shift 15s ease infinite",
        "gradient-shift-fast": "gradient-shift 10s ease infinite",
        "segment-fill": "segment-fill 0.35s ease-out forwards",
        shimmer: "shimmer 1.2s ease-in-out infinite",
        "task-drop-in": "task-drop-in 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [typography],
};

export default config;
