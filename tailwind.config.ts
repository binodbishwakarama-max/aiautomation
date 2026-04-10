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
        background: "#0A0A0F",
        surface: "#111118",
        border: "#1E1E2E",
        primary: {
          DEFAULT: "#6EE7B7",
          foreground: "#0A0A0F"
        },
        secondary: {
          DEFAULT: "#818CF8",
          foreground: "#FFFFFF"
        },
        textPrimary: "#F1F5F9",
        textMuted: "#64748B",
      },
      borderRadius: {
        DEFAULT: "12px",
        'card': "20px"
      },
      boxShadow: {
        'glow-primary': "0 0 20px -5px rgba(110, 231, 183, 0.4)",
        'glow-secondary': "0 0 20px -5px rgba(129, 140, 248, 0.4)",
      }
    },
  },
  plugins: [],
};
export default config;
