/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        card: '#BEBBB4',
        burgundy: {
          DEFAULT: '#6b1d2f',
          dark: '#4a1220',
        },
        gold: '#c5a059',
        parchment: '#f5f1e8',
        ink: '#2c2420',
        muted: '#7d7168',
      },
      fontFamily: {
        cormorant: ['"Cormorant Garamond"', 'serif'],
      },
    },
  },
  plugins: [],
}
