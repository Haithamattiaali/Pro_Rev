/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    // Opacity transitions
    'transition-opacity',
    'opacity-0',
    'opacity-30',
    'opacity-90',
    'opacity-100',
    'hover:opacity-100',
    // Transform transitions
    'transition-all',
    'transition-transform',
    'transition',
    'transform',
    'translate-y-0',
    '-translate-y-1',
    'translate-y-4',
    '-translate-y-4',
    'scale-95',
    'scale-100',
    'active:scale-95',
    // Duration and timing
    'duration-75',
    'duration-100',
    'duration-150',
    'duration-200',
    'duration-300',
    'ease-in',
    'ease-out',
    'ease-in-out',
    'ease-linear',
    // Layout
    'overflow-hidden',
    'will-change-auto',
    'will-change-transform',
    // Height animations
    'h-0',
    'h-auto',
    'max-h-0',
    'max-h-screen',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#9e1f63',
          dark: '#721548',
          light: '#cb5b96',
        },
        secondary: {
          DEFAULT: '#424046',
          light: '#6a686f',
          pale: '#e2e1e6',
        },
        accent: {
          blue: '#005b8c',
          coral: '#e05e3d',
        },
        neutral: {
          dark: '#2d2d2d',
          mid: '#717171',
          light: '#f2f2f4',
        },
      },
      fontFamily: {
        sans: ['Verdana', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['ABeeZee', 'Verdana', 'sans-serif'],
        body: ['Tahoma', 'Verdana', 'sans-serif'],
      },
      letterSpacing: {
        tighter: '-0.02em',
        tight: '-0.01em',
        wide: '0.01em',
        wider: '0.02em',
      },
      animation: {
        fadeIn: 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}