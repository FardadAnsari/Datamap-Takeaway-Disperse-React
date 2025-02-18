import axios from "axios";

const instance = axios.create({
<<<<<<< HEAD
  baseURL: "https://ai.mealzo.co.uk/api/",
=======
  baseURL: "http://92.205.232.148/api/",
>>>>>>> 1f4e966715e0d4ce8dbb3066cca1871ed76c7483
  headers: {
    "Content-Type": "application/json",
  },
});
export default instance;
