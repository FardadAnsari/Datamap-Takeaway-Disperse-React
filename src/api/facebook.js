import axios from "axios";

const instanceF = axios.create({
  baseURL: "https://marketing.mealzo.co.uk/",
  headers: {
    "Content-Type": "application/json",
  },
});
export default instanceF;
