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
        agri: {
          900: "var(--agri-primary-900)",
          700: "var(--agri-primary-700)",
          500: "var(--agri-primary-500)",
          50: "var(--agri-primary-50)",
        },
        surface: {
          canvas: "var(--surface-canvas)",
          card: "var(--surface-card)",
        },
        border: {
          subtle: "var(--border-subtle)",
          strong: "var(--border-strong)",
          card: "var(--border-card)",
        },
        status: {
          green: {
            bg: "var(--status-green-bg)",
            border: "var(--status-green-border)",
            text: "var(--status-green-text)",
            accent: "var(--status-green-accent)",
          },
          amber: {
            bg: "var(--status-amber-bg)",
            border: "var(--status-amber-border)",
            text: "var(--status-amber-text)",
            accent: "var(--status-amber-accent)",
          },
          red: {
            bg: "var(--status-red-bg)",
            border: "var(--status-red-border)",
            text: "var(--status-red-text)",
            accent: "var(--status-red-accent)",
          },
        },
        content: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "Courier New", "monospace"],
      },
      minHeight: {
        touch: "var(--touch-target-min)",
      },
      minWidth: {
        touch: "var(--touch-target-min)",
      },
    },
  },
  plugins: [],
};

export default config;
