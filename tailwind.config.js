/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Roboto", "sans-serif"],
      },
      backgroundImage: {
        "login-pattern": "url('/login-img.jpg')",
        "google-business": "url('/google-business.png')",
        "login-background": "url('/login-bg.png')",
        "mealzo-logo": "url('/mealzo-logo.svg')",
        "mealzo-sidebar-icon": "url('/mealzo-sidebar-icon.svg')",
        "open-status": "url('/src/assets/status/open-status.svg')",
        "close-status": "url('/src/assets/status/close-status.svg')",
      },
    },
  },
  plugins: [],
};
