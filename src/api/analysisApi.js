import axios from "axios";

const instance = axios.create({
  baseURL: "https://analysis.mega-data.co.uk/data-analysis/",
  headers: {
    "Content-Type": "application/json",
  },
});
export default instance;
