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
        surface: {
          DEFAULT: "#FAF7F2",
          card: "#FAF7F2",
          muted: "#F5EFE6",
          soft: "#FDFBF7",
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
          DEFAULT: "rgba(46, 27, 16, 0.10)",
          soft: "rgba(46, 27, 16, 0.08)",
          dark: "rgba(46, 27, 16, 0.16)",
        },
        border: {
          DEFAULT: "rgba(46, 27, 16, 0.10)",
          soft: "rgba(46, 27, 16, 0.10)",
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
        DEFAULT: "14px",
        card: "20px",
        control: "14px",
        pill: "999px",
        lg: "20px",
        md: "14px",
        full: "999px",
      },
      boxShadow: {
        soft: "0 10px 40px -12px rgba(46, 27, 16, 0.18)",
        lift: "0 24px 60px -20px rgba(46, 27, 16, 0.28)",
        sm: "0 4px 16px -4px rgba(46, 27, 16, 0.08)",
        md: "0 10px 40px -12px rgba(46, 27, 16, 0.18)",
        lg: "0 24px 60px -20px rgba(46, 27, 16, 0.28)",
      },
      transitionTimingFunction: {
        DEFAULT: "cubic-bezier(0.22, 1, 0.36, 1)",
        soft: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      transitionDuration: {
        DEFAULT: "300ms",
        300: "300ms",
      },
    },
  },
  plugins: [],
};
export default config;
