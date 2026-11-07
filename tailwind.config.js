/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        emerald: {
          800: '#064E3B',
          900: '#045D3C',
          950: '#023824',
        },
        gold: {
          400: '#FBBF24',
          500: '#D4AF37',
          600: '#B8860B',
        },
        cream: '#FDFBF7',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}