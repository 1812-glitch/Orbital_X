/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'deep-navy': '#0A0F1F',
        'cosmic-blue': '#121C36',
        'tech-cyan': '#00F0FF',
        'alert-red': '#FF2A2A',
        'status-green': '#00FF66',
        'warn-amber': '#FFB000',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      }
    },
  },
  plugins: [],
}
