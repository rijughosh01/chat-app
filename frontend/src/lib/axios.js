import axios from "axios";

const backendBase =
  import.meta.env.VITE_BACKEND_URL ||
  (import.meta.env.MODE === "development"
    ? "http://localhost:5001"
    : "https://nexchatapp.onrender.com");

export const axiosInstance = axios.create({
  baseURL: backendBase.replace(/\/$/, "") + "/api",
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("chat_auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});