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
          800: "var(--agri-primary-800)",
          700: "var(--agri-primary-700)",
          600: "var(--agri-primary-600)",
          500: "var(--agri-primary-500)",
          100: "var(--agri-primary-100)",
          50: "var(--agri-primary-50)",
        },
        surface: {
          canvas: "var(--surface-canvas)",
          subtle: "var(--surface-subtle)",
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
        sans: [
          '"Plus Jakarta Sans"',
          '"Inter"',
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "sans-serif",
        ],
        mono: [
          '"JetBrains Mono"',
          '"Cascadia Mono"',
          '"Consolas"',
          '"Courier New"',
          "monospace",
        ],
      },
      boxShadow: {
        bento: "0 4px 20px -2px rgba(20, 83, 45, 0.05), 0 1px 3px 0 rgba(15, 23, 42, 0.04)",
        "bento-lg": "0 12px 32px -4px rgba(20, 83, 45, 0.08), 0 4px 10px -2px rgba(15, 23, 42, 0.04)",
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
