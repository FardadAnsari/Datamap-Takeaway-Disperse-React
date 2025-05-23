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
        mealzo: "url('/sidebar/mealzo.svg')",
        companies: "url('/sidebar/companies.svg')",
        "companies-active": "url('/sidebar/companies-focus.svg')",
        gbusiness: "url('/sidebar/g-business.svg')",
        "gbusiness-active": "url('/sidebar/g-business-focus.svg')",
        "gbusiness-map": "url('/sidebar/g-business-map.svg')",
        "gbusiness-map-active": "url('/sidebar/g-business-map-focus.svg')",
        "facebook-report": "url('/sidebar/fb-report.svg')",
        "facebook-report-active": "url('/sidebar/fb-report-active.svg')",
        "googleb-button-icon": "url('src/assets/resultbar/googleb-button.svg')",
        facebook: "url('/sidebar/facebook.svg')",
        "facebook-active": "url('/sidebar/facebook-focus.svg')",
        "facebook-resultbar-icon":
          "url('src/assets/resultbar/facebook-button.svg')",
        devices: "url('/sidebar/devices.svg')",
        "devices-active": "url('/sidebar/devices-focus.svg')",
        "justeat-devices": "url('src/assets/devices/justeat-devices.svg')",
        "ubereats-devices": "url('src/assets/devices/ubereats-devices.svg')",
        "foodhub-devices": "url('src/assets/devices/foodhub-devices.svg')",
        "total-on-devices": "url('src/assets/devices/total-on-device.svg')",
        "total-off-devices": "url('src/assets/devices/total-off-device.svg')",
        "total-shops": "url('src/assets/devices/total-shops-icon.svg')",
        "open-status": "url('/src/assets/status/open-status.svg')",
        "close-status": "url('/src/assets/status/close-status.svg')",
        "no-result": "url('/no-result-matching.svg')",
        "no-access": "url('/no-access-permission.svg')",
        "refresh-button": "url('/button/refresh-button.svg')",
        "empty-state-chart":
          "url('src/assets/google-business-empty-states/empty-state-chart.svg')",
        "empty-state-hours":
          "url('src/assets/google-business-empty-states/empty-state-hours.svg')",
        "empty-state-interaction":
          "url('src/assets/google-business-empty-states/empty-state-interaction.svg')",
        "empty-state-table":
          "url('src/assets/google-business-empty-states/empty-state-table.svg')",
        "empty-state-photo":
          "url('/facebook-empty-states/empty-state-photo.svg')",
        "not-found": "url('/not-found.svg')",
      },
    },
  },
  plugins: [],
};
