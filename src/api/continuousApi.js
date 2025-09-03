import axios from "axios";

const instanceTracker = axios.create({
  baseURL: "https://pulsetracker.mega-data.co.uk/api/",
  headers: {
    "Content-Type": "application/json",
  },
});
export default instanceTracker;
