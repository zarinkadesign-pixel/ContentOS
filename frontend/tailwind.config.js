/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx,js,jsx}",
    "./components/**/*.{ts,tsx,js,jsx}",
    "./lib/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      animation: {
        "fade-up":    "fade-up 0.35s ease-out both",
        "fade-in":    "fade-in 0.3s ease-out both",
        "scale-in":   "scale-in 0.2s ease-out both",
        "slide-left": "slide-left 0.3s ease-out both",
      },
      keyframes: {
        "fade-up": {
          "0%":   { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%":   { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "slide-left": {
          "0%":   { opacity: "0", transform: "translateX(-12px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
      transitionDuration: {
        "250": "250ms",
      },
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
