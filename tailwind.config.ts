import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { bg: "#070a12", panel: "#0d1220", panel2: "#111827", line: "#20283a", accent: "#7c5cff" },
      boxShadow: { glow: "0 0 40px rgba(124,92,255,.18)" }
    }
  },
  plugins: []
};
export default config;
