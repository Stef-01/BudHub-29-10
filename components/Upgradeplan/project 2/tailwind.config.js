/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#05aa56',
          dark: '#0c6c2f',
        },
        cream: '#fff7e2',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontWeight: {
        black: '900',
      },
      letterSpacing: {
        tighter: '-0.05em',
        tight: '-0.025em',
      },
    },
  },
  plugins: [],
};
