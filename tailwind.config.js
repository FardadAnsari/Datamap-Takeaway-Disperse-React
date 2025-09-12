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
        "companies-no-access": "url('/sidebar/companies-no-access.svg')",
        gbusiness: "url('/sidebar/g-business.svg')",
        "gbusiness-active": "url('/sidebar/g-business-focus.svg')",
        "gbusiness-no-access": "url('/sidebar/g-business-no-access.svg')",
        "gbusiness-map": "url('/sidebar/g-business-map.svg')",
        "gbusiness-map-active": "url('/sidebar/g-business-map-focus.svg')",
        "gbusiness-map-no-access":
          "url('/sidebar/g-business-map-no-access.svg')",
        "facebook-report": "url('/sidebar/fb-report.svg')",
        "facebook-report-active": "url('/sidebar/fb-report-focus.svg')",
        "facebook-report-no-access": "url('/sidebar/fb-report-no-access.svg')",
        "googleb-button-icon": "url('/resultbar/googleb-button.svg')",
        facebook: "url('/sidebar/facebook.svg')",
        "facebook-active": "url('/sidebar/facebook-focus.svg')",
        "facebook-no-access": "url('/sidebar/facebook-no-access.svg')",
        "facebook-resultbar-icon": "url('/resultbar/facebook-button.svg')",
        analyzer: "url('/sidebar/analyzer.svg')",
        "analyzer-active": "url('/sidebar/analyzer-focus.svg')",
        devices: "url('/sidebar/devices.svg')",
        "devices-active": "url('/sidebar/devices-focus.svg')",
        "devices-no-access": "url('/sidebar/devices-no-access.svg')",
        "continuous-status": "url('/sidebar/continuous-status.svg')",
        "continuous-status-active":
          "url('/sidebar/continuous-status-focus.svg')",
        "continuous-status-no-access":
          "url('/sidebar/continuous-status-no-access.svg')",
        "continuous-count": "url('/sidebar/continuous-count.svg')",
        "continuous-count-active": "url('/sidebar/continuous-count-focus.svg')",
        "continuous-count-no-access":
          "url('/sidebar/continuous-count-no-access.svg')",
        "justeat-devices": "url('/devices/justeat-devices.svg')",
        "justeat-check-devices":
          "url('/devices/checkbox/justeat-checkbox.svg')",
        "mealzo-devices": "url('/devices/mealzo-devices.svg')",
        "mealzo-check-devices": "url('/devices/checkbox/mealzo-checkbox.svg')",
        "ubereats-devices": "url('/devices/ubereats-devices.svg')",
        "feedmeonline-devices": "url('/devices/feedmeonline-devices.svg')",
        "feedmeonline-check-devices":
          "url('/devices/checkbox/feedmeonline-checkbox.svg')",
        "foodhub-devices": "url('/devices/foodhub-devices.svg')",
        "foodhub-check-devices":
          "url('/devices/checkbox/foodhub-checkbox.svg')",
        "total-on-devices": "url('/devices/total-on-device.svg')",
        "total-off-devices": "url('/devices/total-off-device.svg')",
        "total-shops": "url('/devices/total-shops-icon.svg')",
        "open-status": "url('/status/open-status.svg')",
        "close-status": "url('/status/close-status.svg')",
        "no-result": "url('/no-result-matching.svg')",
        "no-access": "url('/no-access-permission.svg')",
        "refresh-button": "url('/button/refresh-button.svg')",
        "filter-button": "url('/button/filter-btn.svg')",
        "empty-state-chart": "url('/empty-states/empty-state-chart.svg')",
        "empty-state-hours": "url('/empty-states/empty-state-hours.svg')",
        "empty-state-interaction":
          "url('/empty-states/empty-state-interaction.svg')",
        "empty-state-table": "url('/empty-states/empty-state-table.svg')",
        "empty-state-photo": "url('/empty-states/empty-state-photo.svg')",
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
