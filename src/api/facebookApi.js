import axios from "axios";

const instanceF = axios.create({
  baseURL: "https://facebook.mega-data.co.uk/facebook",
  headers: {
    "Content-Type": "application/json",
  },
});
export default instanceF;
