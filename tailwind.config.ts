import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#CC785C",
          foreground: "#FFFFFF",
          50: "#FDF8F6",
          100: "#FCEFE9",
          200: "#F8DCCF",
          300: "#F2C6B0",
          400: "#E8956E",
          500: "#CC785C",
          600: "#B05D41",
          700: "#8F462E",
          800: "#703624",
          900: "#5C2D1F",
        },
        background: "#FBF8F3",
        surface: "#FFFFFF",
        "surface-highlight": "#F5EFE6",
        border: "#E5E7EB",
        text: {
          primary: "#2B1810",
          secondary: "#5C4A42",
          muted: "#8F7E77",
        },
        success: "#4CAF50",
        warning: "#FFC107",
        error: "#EF5350",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(43, 24, 16, 0.05)',
        'card': '0 0 0 1px rgba(43, 24, 16, 0.04), 0 2px 8px rgba(43, 24, 16, 0.04)',
        'card-hover': '0 0 0 1px rgba(43, 24, 16, 0.08), 0 8px 24px rgba(43, 24, 16, 0.08)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      animation: {
        slideUp: "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        fadeIn: "fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        scaleIn: "scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        slideUp: {
          from: {
            opacity: "0",
            transform: "translateY(20px)",
          },
          to: {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
