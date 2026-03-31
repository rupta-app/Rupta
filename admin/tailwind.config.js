/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0A0A0F',
        surface: '#14141F',
        primary: '#8B5CF6',
        muted: '#94A3B8',
      },
    },
  },
  plugins: [],
};
