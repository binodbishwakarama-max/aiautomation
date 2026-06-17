import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--color-background)",
        surface: "var(--color-surface)",
        border: "var(--color-border)",
        accent: "var(--color-accent)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        danger: "var(--color-danger)",
        textPrimary: "var(--color-text-primary)",
        textMuted: "var(--color-text-muted)",
        primary: {
          DEFAULT: "var(--color-accent)",
          foreground: "var(--color-background)"
        },
        secondary: {
          DEFAULT: "#818CF8",
          foreground: "#FFFFFF"
        },
      },
      fontSize: {
        display: ["2.5rem", { lineHeight: "3rem", fontWeight: "800" }],
        h1: ["2rem", { lineHeight: "2.5rem", fontWeight: "700" }],
        h2: ["1.5rem", { lineHeight: "2rem", fontWeight: "600" }],
        body: ["0.875rem", { lineHeight: "1.25rem", fontWeight: "400" }],
        caption: ["0.75rem", { lineHeight: "1rem", fontWeight: "400" }],
      },
      spacing: {
        "s-4": "4px",
        "s-8": "8px",
        "s-12": "12px",
        "s-16": "16px",
        "s-24": "24px",
        "s-32": "32px",
        "s-48": "48px",
      },
      borderRadius: {
        DEFAULT: "12px",
        'card': "var(--radius-card)"
      },
      boxShadow: {
        'glow-primary': "0 0 20px -5px rgba(2, 198, 151, 0.4)",
        'glow-secondary': "0 0 20px -5px rgba(129, 140, 248, 0.4)",
        'card-shadow': "var(--shadow-card)",
      }
    },
  },
  plugins: [],
};
export default config;
