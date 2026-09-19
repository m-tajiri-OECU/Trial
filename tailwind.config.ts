import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        oecu: {
          navy: "#0f2a4a",
          teal: "#0e7c86",
          mint: "#e6f5f3",
        },
      },
    },
  },
  plugins: [],
};

export default config;
