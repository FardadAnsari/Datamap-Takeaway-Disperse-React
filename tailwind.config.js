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
        "justeat-devices": "url('src/assets/devices/justeat-devices.svg')",
        "ubereats-devices": "url('src/assets/devices/ubereats-devices.svg')",
        "foodhub-devices": "url('src/assets/devices/foodhub-devices.svg')",
        "total-on-devices": "url('src/assets/devices/total-on-device.svg')",
        "total-off-devices": "url('src/assets/devices/total-off-device.svg')",
        "total-shops": "url('src/assets/devices/total-shops-icon.svg')",
        "open-status": "url('/src/assets/status/open-status.svg')",
        "close-status": "url('/src/assets/status/close-status.svg')",
        "no-result": "url('/No-Result-Matching.svg')",
      },
    },
  },
  plugins: [],
};
