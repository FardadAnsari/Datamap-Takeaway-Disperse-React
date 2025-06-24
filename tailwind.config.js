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
        "googleb-button-icon": "url('/resultbar/googleb-button.svg')",
        facebook: "url('/sidebar/facebook.svg')",
        "facebook-active": "url('/sidebar/facebook-focus.svg')",
        "facebook-resultbar-icon": "url('/resultbar/facebook-button.svg')",
        devices: "url('/sidebar/devices.svg')",
        "devices-active": "url('/sidebar/devices-focus.svg')",
        "justeat-devices": "url('/devices/justeat-devices.svg')",
        "ubereats-devices": "url('/devices/ubereats-devices.svg')",
        "foodhub-devices": "url('/devices/foodhub-devices.svg')",
        "total-on-devices": "url('/devices/total-on-device.svg')",
        "total-off-devices": "url('/devices/total-off-device.svg')",
        "total-shops": "url('/devices/total-shops-icon.svg')",
        "open-status": "url('/status/open-status.svg')",
        "close-status": "url('/status/close-status.svg')",
        "no-result": "url('/no-result-matching.svg')",
        "no-access": "url('/no-access-permission.svg')",
        "refresh-button": "url('/button/refresh-button.svg')",
        "empty-state-chart":
          "url('/google-business-empty-states/empty-state-chart.svg')",
        "empty-state-hours":
          "url('/google-business-empty-states/empty-state-hours.svg')",
        "empty-state-interaction":
          "url('/google-business-empty-states/empty-state-interaction.svg')",
        "empty-state-table":
          "url('/google-business-empty-states/empty-state-table.svg')",
        "empty-state-photo":
          "url('/facebook-empty-states/empty-state-photo.svg')",
        "not-found": "url('/not-found.svg')",
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms")({
      strategy: "class",
    }),
  ],
};
