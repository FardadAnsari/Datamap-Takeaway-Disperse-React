import axios from "axios";

const instance = axios.create({
  baseURL: "http://92.205.232.148/api/",
  headers: {
    "Content-Type": "application/json",
  },
});
export default instance;
