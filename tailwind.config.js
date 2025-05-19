// tailwind.config.js (ensure it's compatible with v4)
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html", // Or your main HTML file
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      // Your custom theme extensions from Response #8 are likely still valid:
      animation: {
        'spin-celebrate': 'spin-celebrate 0.5s ease-out forwards',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
      },
      keyframes: {
        'spin-celebrate': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.15)' },
          '100%': { transform: 'scale(1)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        }
      }
    },
  },
  plugins: [
    // Consult v4 documentation if you use Tailwind plugins; how they are added might change.
  ],
}