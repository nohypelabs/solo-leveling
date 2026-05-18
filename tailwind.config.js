/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        'sl-bg': '#0a0a0a',
        'sl-cyan': '#00f3ff',
        'sl-pink': '#ff00cc',
        'sl-text': '#e0e0e0',
      },
    },
  },
  plugins: [],
};
