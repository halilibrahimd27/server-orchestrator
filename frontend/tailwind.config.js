/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          850: '#1a202e',
        }
      },
      animation: {
        'spin': 'spin 1s linear infinite',
      }
    },
  },
  plugins: [],
}
