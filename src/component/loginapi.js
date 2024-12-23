import axios from "axios";

const instanceLogin = axios.create({
  baseURL: "https://takeawaytracker.mealzo.co.uk/",
  headers: {
    "Content-Type": "application/json",
  },
});

export default instanceLogin;
