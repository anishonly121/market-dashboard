/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          base: "#0f0f1a",
          elevated: "#1a1a2e",
          card: "#1e1e30",
          border: "#2d2d4e",
        },
        brand: {
          DEFAULT: "#6366f1",
          light: "#818cf8",
          dark: "#4f46e5",
        },
        green: { DEFAULT: "#22c55e", dim: "#166534" },
        red:   { DEFAULT: "#ef4444", dim: "#7f1d1d" },
        amber: { DEFAULT: "#f59e0b" },
        cyan:  { DEFAULT: "#06b6d4" },
        muted: "#8888aa",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      animation: {
        "fade-in": "fadeIn .2s ease",
        "slide-up": "slideUp .25s ease",
        pulse2: "pulse 1.5s cubic-bezier(0.4,0,0.6,1) infinite",
      },
      keyframes: {
        fadeIn:  { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp: { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
      },
    },
  },
  plugins: [],
};
