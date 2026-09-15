/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        signal: '#FC4C02',
        noise: '#5B6B84',
        neutral: '#F5F6F7',
        empty: '#2C2C2E',
        midnight: '#121316',
      },
    },
  },
  plugins: [],
};
