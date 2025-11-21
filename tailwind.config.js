/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./index.tsx",
    "./App.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./contexts/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#05aa56',
          dark: '#0c6c2f',
        },
        cream: '#fff7e2',
        purple: {
          500: '#8B3FE8',
          600: '#7C3AED',
        },
        // Fruit-inspired accent colors
        strawberry: '#E53E3E',
        blueberry: '#5A67D8',
        kiwi: '#84CC16',
        watermelon: '#EF4444',
        pineapple: '#FBBF24',
        grape: '#7C3AED',
        // Glass morphism backgrounds
        'glass-white': 'rgba(255, 255, 255, 0.7)',
        'glass-dark': 'rgba(31, 41, 55, 0.7)',
        'glass-green': 'rgba(16, 185, 129, 0.2)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
        accent: ['Space Grotesk', 'monospace'],
      },
      fontWeight: {
        black: '900',
      },
      letterSpacing: {
        tighter: '-0.05em',
        tight: '-0.025em',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'jump-in': 'jump-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        'fade-in': 'fade-in 0.3s ease-out forwards',
        'slide-down': 'slide-down 0.4s ease-out forwards',
        'bounce-in': 'bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards',
        'pulse-slow': 'pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scale-in': 'scale-in 0.2s ease-out forwards',
        'shimmer': 'shimmer 2s linear infinite',
        // New animations from Upgradeplan
        'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out 2s infinite',
        'bounce-slow': 'bounce 3s infinite',
        'scroll-indicator': 'scrollIndicator 2s ease-in-out infinite',
      },
      keyframes: {
        'jump-in': {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'bounce-in': {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '50%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        // New keyframes from Upgradeplan
        'fadeInUp': {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'scrollIndicator': {
          '0%, 100%': { transform: 'translate(-50%, 0)', opacity: '1' },
          '50%': { transform: 'translate(-50%, 10px)', opacity: '0.5' },
        },
      },
    },
  },
  plugins: [],
}
