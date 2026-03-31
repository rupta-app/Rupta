/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter_400Regular'],
        semibold: ['Inter_600SemiBold'],
        bold: ['Inter_700Bold'],
      },
      colors: {
        background: '#0A0A0F',
        surface: '#14141F',
        surfaceElevated: '#1E1E2E',
        foreground: '#F8FAFC',
        primary: '#8B5CF6',
        secondary: '#06D6A0',
        respect: '#F59E0B',
        danger: '#EF4444',
        border: '#2E2E3E',
        muted: '#94A3B8',
      },
    },
  },
  plugins: [],
};
