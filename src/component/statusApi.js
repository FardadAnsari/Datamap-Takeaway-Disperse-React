import axios from "axios";

const instance = axios.create({
  baseURL: "http://192.168.5.208/api/",
  headers: {
    "Content-Type": "application/json",
  },
});
export default instance;
