/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx,js,jsx}",
    "./components/**/*.{ts,tsx,js,jsx}",
    "./lib/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg:      "#050710",
        nav:     "#08091c",
        card:    "#0d1126",
        border:  "#1a1f3a",
        accent:  "#6c63ff",
        accent2: "#8b5cf6",
        green:   "#10b981",
        yellow:  "#f59e0b",
        red:     "#ef4444",
        muted:   "#64748b",
        text:    "#e2e8f0",
        subtext: "#94a3b8",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
      },
    },
  },
  plugins: [],
};
