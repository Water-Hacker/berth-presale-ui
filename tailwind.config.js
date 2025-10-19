/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#ff0000',          // accent color for buttons/alerts
        secondary: '#0ad9f5',        // cool blue accent
        darkBg: '#0b0b0b',           // main dark background
        gradientStart: '#000000',
        gradientEnd: '#1a1a1a',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'red-glow': '0 0 30px rgba(255,0,0,0.8)',
        'banner': '0 0 20px rgba(255,0,0,0.6)',
      },
      borderRadius: {
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [
    require('tailwind-scrollbar')({ nocompatible: true }), // smooth custom scrollbar
  ],
  corePlugins: {
    preflight: true, // keeps normalize.css defaults
  },
}
