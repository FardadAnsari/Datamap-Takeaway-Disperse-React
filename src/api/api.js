import axios from "axios";

const instance = axios.create({
  baseURL: "https://takeawaytracker.mealzo.co.uk/",
  // baseURL: "https://marketing.mealzo.co.uk/",
  headers: {
    "Content-Type": "application/json",
  },
});
export default instance;
