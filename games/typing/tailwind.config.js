/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './App.tsx', './components/**/*.tsx'],
  theme: {
    extend: {
      screens: {
        // Landscape phones: very little vertical room
        short: { raw: '(max-height: 500px)' },
      },
      fontFamily: {
        vt323: ['VT323', 'monospace'],
      },
    },
  },
  plugins: [],
};
