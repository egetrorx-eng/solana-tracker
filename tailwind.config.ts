import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#000000",
        green: {
          DEFAULT: "#00FF41",
          300: "#00FF41",
          dark: "#003B00",
          darker: "#001A00",
        },
        red: {
          DEFAULT: "#FF0000",
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"SF Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
export default config;
