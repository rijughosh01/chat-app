import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: "https://chat-app-vnee.onrender.com",
  withCredentials: true,
});