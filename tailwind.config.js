/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter24Regular'],
        'inter-medium': ['Inter24Medium'],
        'inter-semibold': ['Inter24SemiBold'],
        'inter-bold': ['Inter24Bold'],
      },
      colors: {
        app: {
          bg: '#1A1C19',
          primary: '#4CAF50',
          text: '#F5F5DC',
          surface: '#242922',
          accent: '#F39C12',
        },
        saffron: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#F39C12',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        green: {
          500: '#4CAF50',
          600: '#388E3C',
        },
      },
    },
  },
  plugins: [],
};
