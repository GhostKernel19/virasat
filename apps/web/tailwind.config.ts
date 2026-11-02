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
        "bg-0": "rgb(var(--bg-0-rgb) / <alpha-value>)",
        "bg-1": "rgb(var(--bg-1-rgb) / <alpha-value>)",
        surface: {
          DEFAULT: "var(--surface)",
          solid: "rgb(var(--surface-solid-rgb) / <alpha-value>)",
          card: "var(--surface)",
          muted: "rgb(var(--bg-1-rgb) / <alpha-value>)",
          soft: "rgb(var(--surface-solid-rgb) / <alpha-value>)",
        },
        "surface-solid": "rgb(var(--surface-solid-rgb) / <alpha-value>)",
        border: "var(--border)",
        text: {
          DEFAULT: "rgb(var(--text-rgb) / <alpha-value>)",
          muted: "var(--text-muted)",
        },
        "text-muted": "var(--text-muted)",
        accent: {
          DEFAULT: "rgb(var(--accent-rgb) / <alpha-value>)",
          strong: "rgb(var(--accent-strong-rgb) / <alpha-value>)",
          2: "rgb(var(--accent-2-rgb) / <alpha-value>)",
        },
        "accent-strong": "rgb(var(--accent-strong-rgb) / <alpha-value>)",
        "accent-2": "rgb(var(--accent-2-rgb) / <alpha-value>)",
        success: "rgb(var(--success-rgb) / <alpha-value>)",
        danger: "rgb(var(--danger-rgb) / <alpha-value>)",

        // Compatibility Aliases for legacy component classes
        sand: {
          DEFAULT: "rgb(var(--bg-0-rgb) / <alpha-value>)",
          50: "var(--surface)",
          card: "var(--surface)",
          100: "rgb(var(--bg-1-rgb) / <alpha-value>)",
          200: "rgb(var(--surface-solid-rgb) / <alpha-value>)",
          300: "var(--surface)",
        },
        ink: {
          DEFAULT: "rgb(var(--text-rgb) / <alpha-value>)",
          muted: "var(--text-muted)",
          light: "var(--text-muted)",
          subtle: "var(--text-muted)",
        },
        line: {
          DEFAULT: "var(--border)",
          soft: "var(--border)",
          dark: "var(--border)",
        },
        terracotta: {
          DEFAULT: "rgb(var(--accent-rgb) / <alpha-value>)",
          light: "rgb(var(--accent-rgb) / <alpha-value>)",
          dark: "rgb(var(--accent-strong-rgb) / <alpha-value>)",
          50: "rgb(var(--surface-solid-rgb) / <alpha-value>)",
          100: "var(--surface)",
        },
        indigo: {
          DEFAULT: "rgb(var(--accent-rgb) / <alpha-value>)",
          light: "rgb(var(--accent-rgb) / <alpha-value>)",
          dark: "rgb(var(--accent-strong-rgb) / <alpha-value>)",
          50: "rgb(var(--surface-solid-rgb) / <alpha-value>)",
        },
        green: {
          DEFAULT: "rgb(var(--success-rgb) / <alpha-value>)",
          light: "rgb(var(--success-rgb) / <alpha-value>)",
          dark: "rgb(var(--success-rgb) / <alpha-value>)",
          50: "var(--surface)",
        },
        gold: {
          DEFAULT: "rgb(var(--accent-2-rgb) / <alpha-value>)",
          light: "rgb(var(--accent-2-rgb) / <alpha-value>)",
          dark: "rgb(var(--accent-2-rgb) / <alpha-value>)",
          50: "var(--surface)",
        },
      },
      fontFamily: {
        serif: ["var(--font-newsreader)", "serif"],
        sans: ["var(--font-inter)", "sans-serif"],
        newsreader: ["var(--font-newsreader)", "serif"],
        inter: ["var(--font-inter)", "sans-serif"],
        devanagari: ["var(--font-mukta)", "sans-serif"],
        "noto-devanagari": ["var(--font-noto-serif-devanagari)", "serif"],
        mukta: ["var(--font-mukta)", "sans-serif"],
        "devanagari-heading": ["var(--font-noto-serif-devanagari)", "serif"],
        "devanagari-body": ["var(--font-mukta)", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "var(--radius-control)",
        card: "var(--radius-card)",
        control: "var(--radius-control)",
        pill: "var(--radius-pill)",
        lg: "var(--radius-card)",
        md: "var(--radius-control)",
        full: "var(--radius-pill)",
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
        lift: "var(--shadow-lift)",
        glow: "var(--glow)",
        "glow-sm": "var(--glow-sm)",
        sm: "var(--shadow-soft)",
        md: "var(--shadow-soft)",
        lg: "var(--shadow-lift)",
      },
      transitionTimingFunction: {
        DEFAULT: "var(--ease)",
        soft: "var(--ease)",
      },
      transitionDuration: {
        DEFAULT: "var(--duration)",
        300: "var(--duration)",
      },
    },
  },
  plugins: [],
};

export default config;
