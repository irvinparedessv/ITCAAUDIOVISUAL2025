import axios from "axios";

const api = axios.create({
  baseURL: "https://apiv2.prestamod612.online/api", // la URL de tu backend Laravel
  withCredentials: true, // necesario para que envíe cookies (Sanctum)
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  console.log(localStorage.getItem("token"));
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ⬇️ Este interceptor permite que los errores lleguen al catch del Login
api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default api;
