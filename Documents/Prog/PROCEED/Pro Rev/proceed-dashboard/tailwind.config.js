/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
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
    },
  },
  plugins: [],
}