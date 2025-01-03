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
        "deliveroo-pin": "url('/deliveroo-pin.svg')",
        "foodhub-pin": "url('/foodhub-pin.svg')",
        "googleb-pin": "url('/googleb-pin.svg')",
        "justeat-pin": "url('/justeat-pin.svg')",
        "kuick-pin": "url('/kuick-pin.svg')",
        "mealzo-pin": "url('/mealzo-pin.svg')",
        "menulist-pin": "url('/menulist-pin.svg')",
        "scoffable-pin": "url('/scoffable-pin.svg')",
        "straightfrom-pin": "url('/straightfrom-pin.svg')",
        "ubereats-pin": "url('/ubereats-pin.svg')",
        "wtf-pin": "url('/wtf-pin.svg')",
      },
    },
  },
  plugins: [],
};
