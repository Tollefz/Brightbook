import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1a1a1a', // Matt svart
          dark: '#000000',
          light: '#2a2a2a',
        },
        espresso: {
          DEFAULT: '#3d2817', // Dyp brun
          dark: '#2a1a0f',
          light: '#5a3d2a',
        },
        dark: {
          DEFAULT: '#000000',
          secondary: '#1a1a1a',
        },
        gray: {
          light: '#f9f9f9',
          medium: '#666666',
          border: '#e5e5e5',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
