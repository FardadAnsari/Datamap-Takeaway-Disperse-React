import axios from "axios";

const instanceLogin = axios.create({
  baseURL: "https://google.mega-data.co.uk/",
  // baseURL: "https://takeawaytracker.mealzo.co.uk/",
  // baseURL: "https://marketing.mealzo.co.uk/",
  headers: {
    "Content-Type": "application/json",
  },
});

export default instanceLogin;
