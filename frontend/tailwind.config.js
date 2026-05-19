/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Academic dark palette
        ink: {
          50:  "#f0f4ff",
          100: "#dce6ff",
          200: "#b9ccff",
          300: "#8aa6ff",
          400: "#6366f1",
          500: "#4f46e5",
          600: "#4338ca",
          700: "#3730a3",
          800: "#312e81",
          900: "#1e1b4b",
          950: "#0d0f1a",
        },
        slate: {
          50:  "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },
        academic: {
          bg:      "#080b14",
          surface: "#0d1117",
          card:    "#131825",
          border:  "#1f2937",
          muted:   "#374151",
          text:    "#f1f5f9",
          subtle:  "#94a3b8",
        },
        // Event category colours
        event: {
          exam:    "#ef4444",
          assign:  "#f59e0b",
          study:   "#6366f1",
          class:   "#3b82f6",
          other:   "#94a3b8",
        },
      },
      fontFamily: {
        display: ["var(--font-lexend)", "system-ui", "sans-serif"],
        body:    ["var(--font-lexend)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "academic-gradient": "linear-gradient(135deg, #080b14 0%, #0d1117 50%, #080b14 100%)",
        "glow-indigo":       "radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.15) 0%, transparent 70%)",
      },
      boxShadow: {
        "glow-sm":  "0 0 12px rgba(99,102,241,0.25)",
        "glow-md":  "0 0 24px rgba(99,102,241,0.3)",
        "card":     "0 1px 3px rgba(0,0,0,0.5), 0 0 0 1px rgba(31,41,55,0.8)",
      },
      animation: {
        "slide-up":    "slideUp 0.4s cubic-bezier(0.16,1,0.3,1)",
        "slide-right": "slideRight 0.35s cubic-bezier(0.16,1,0.3,1)",
        "fade-in":     "fadeIn 0.25s ease",
        "pulse-soft":  "pulseSoft 2.5s ease-in-out infinite",
        "bounce-in":   "bounceIn 0.5s cubic-bezier(0.34,1.56,0.64,1)",
        "shimmer":     "shimmer 2s linear infinite",
      },
      keyframes: {
        slideUp:    { from: { opacity: "0", transform: "translateY(16px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        slideRight: { from: { opacity: "0", transform: "translateX(-16px)" }, to: { opacity: "1", transform: "translateX(0)" } },
        fadeIn:     { from: { opacity: "0" }, to: { opacity: "1" } },
        pulseSoft:  { "0%,100%": { opacity: "1" }, "50%": { opacity: "0.6" } },
        bounceIn:   { "0%": { transform: "scale(0.8)", opacity: "0" }, "100%": { transform: "scale(1)", opacity: "1" } },
        shimmer:    { from: { backgroundPosition: "-200% 0" }, to: { backgroundPosition: "200% 0" } },
      },
    },
  },
  plugins: [],
};
