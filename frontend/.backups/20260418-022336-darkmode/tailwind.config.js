/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Primary palette
        "primary": "#2346d5",
        "on-primary": "#ffffff",
        "primary-container": "#4361ee",
        "on-primary-container": "#f4f2ff",
        "primary-fixed": "#dee1ff",
        "primary-fixed-dim": "#bac3ff",
        "on-primary-fixed": "#001159",
        "on-primary-fixed-variant": "#0031c4",
        "inverse-primary": "#bac3ff",

        // Secondary palette
        "secondary": "#5d5c74",
        "on-secondary": "#ffffff",
        "secondary-container": "#e2e0fc",
        "on-secondary-container": "#63627a",
        "secondary-fixed": "#e2e0fc",
        "secondary-fixed-dim": "#c6c4df",
        "on-secondary-fixed": "#1a1a2e",
        "on-secondary-fixed-variant": "#45455b",

        // Tertiary palette
        "tertiary": "#933c00",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#ba4e00",
        "on-tertiary-container": "#fff1eb",
        "tertiary-fixed": "#ffdbcb",
        "tertiary-fixed-dim": "#ffb692",
        "on-tertiary-fixed": "#341100",
        "on-tertiary-fixed-variant": "#793000",

        // Surface hierarchy (CRITICAL - used for "No-Line Rule")
        "surface": "#f8f9fa",
        "surface-dim": "#d9dadb",
        "surface-bright": "#f8f9fa",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f3f4f5",
        "surface-container": "#edeeef",
        "surface-container-high": "#e7e8e9",
        "surface-container-highest": "#e1e3e4",
        "surface-variant": "#e1e3e4",
        "surface-tint": "#2e4edc",
        "on-surface": "#191c1d",
        "on-surface-variant": "#444655",
        "inverse-surface": "#2e3132",
        "inverse-on-surface": "#f0f1f2",

        // Background
        "background": "#f8f9fa",
        "on-background": "#191c1d",

        // Outline
        "outline": "#747686",
        "outline-variant": "#c4c5d7",

        // Error
        "error": "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px",
      },
      fontFamily: {
        headline: ["Inter", "sans-serif"],
        body: ["Inter", "sans-serif"],
        label: ["Inter", "sans-serif"],
        sans: ["Inter", "sans-serif"],
      },
      letterSpacing: {
        tightest: "-0.02em",
        wider: "0.05em",
      },
      boxShadow: {
        // "Double-Drop" ambient shadow from DESIGN.md
        "ambient": "0px 4px 20px rgba(26, 26, 46, 0.04), 0px 8px 40px rgba(26, 26, 46, 0.08)",
        "ambient-sm": "0px 2px 10px rgba(26, 26, 46, 0.04), 0px 4px 20px rgba(26, 26, 46, 0.06)",
      },
      backdropBlur: {
        glass: "16px",
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/container-queries"),
  ],
}
