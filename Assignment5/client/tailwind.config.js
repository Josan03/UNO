/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'uno-red': '#C62828',
        'uno-blue': '#1565C0',
        'uno-green': '#2E7D32',
        'uno-yellow': '#F9A825',
      }
    },
  },
  plugins: [],
}
