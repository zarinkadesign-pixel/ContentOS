import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg:       "#050710",
        nav:      "#08091c",
        card:     "#0d1126",
        border:   "#1a1f3a",
        accent:   "#6c63ff",
        accent2:  "#8b5cf6",
        green:    "#10b981",
        yellow:   "#f59e0b",
        red:      "#ef4444",
        muted:    "#64748b",
        text:     "#e2e8f0",
        subtext:  "#94a3b8",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
      },
    },
  },
  plugins: [],
};

export default config;
