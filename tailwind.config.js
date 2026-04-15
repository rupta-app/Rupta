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
        background: '#0C0C10',
        surface: '#16161D',
        surfaceElevated: '#1E1E28',
        foreground: '#EDEDF0',
        primary: '#8B6CFF',
        primaryLight: '#A78BFA',
        secondary: '#2DD4A0',
        respect: '#FF3040',
        danger: '#EF4444',
        dangerLight: '#F87171',
        border: '#232330',
        muted: '#9898A6',
        mutedForeground: '#5C5C6F',
      },
    },
  },
  plugins: [],
};
