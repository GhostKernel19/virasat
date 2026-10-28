import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sand: {
          DEFAULT: "#F5EFE6",
          50: "#FAF7F2",
          card: "#FAF7F2",
          100: "#F5EFE6",
          200: "#EFE7DC",
          300: "#E2D7C5",
        },
        terracotta: {
          DEFAULT: "#C65D3B",
          light: "#D77252",
          dark: "#A74627",
          50: "#FDF6F3",
          100: "#F9ECE7",
        },
        indigo: {
          DEFAULT: "#2E3A59",
          light: "#3E4D74",
          dark: "#1F273D",
          50: "#F3F5FA",
        },
        green: {
          DEFAULT: "#3F6B5B",
          light: "#4F8571",
          dark: "#2F5245",
          50: "#F2F7F5",
        },
        gold: {
          DEFAULT: "#D9A441",
          light: "#E4BA5E",
          dark: "#B3832A",
          50: "#FCF8EE",
        },
        ink: {
          DEFAULT: "#1F2937",
          muted: "#4B5563",
          light: "#6B7280",
          subtle: "#9CA3AF",
        },
        line: {
          DEFAULT: "#E5DED2",
          dark: "#D6CCC0",
        },
      },
      fontFamily: {
        serif: ["var(--font-fraunces)", "serif"],
        sans: ["var(--font-inter)", "sans-serif"],
        devanagari: ["var(--font-mukta)", "sans-serif"],
        fraunces: ["var(--font-fraunces)", "serif"],
        inter: ["var(--font-inter)", "sans-serif"],
        mukta: ["var(--font-mukta)", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "8px",
        lg: "8px",
      },
    },
  },
  plugins: [],
};
export default config;
