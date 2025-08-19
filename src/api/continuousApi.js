import axios from "axios";

const instance = axios.create({
  baseURL: "https://pulsetracker.mega-data.co.uk/api/",
  headers: {
    "Content-Type": "application/json",
  },
});
export default instance;
