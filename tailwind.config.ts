import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#CC785C",
        accent: "#D97757",
        "accent-light": "#E8956E",
        beige: {
          50: "#FBF8F3",
          100: "#F5EFE6",
          200: "#E8DCC8",
        },
        "warm-dark": "#2B1810",
      },
      animation: {
        slideUp: "slideUp 0.3s ease-out",
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
      },
    },
  },
  plugins: [],
};

export default config;
