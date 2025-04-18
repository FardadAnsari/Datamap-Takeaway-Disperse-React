import axios from "axios";

const instance = axios.create({
  baseURL: "https://ai.mealzo.co.uk/api/",
  headers: {
    "Content-Type": "application/json",
  },
});
export default instance;
