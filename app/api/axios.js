import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api", // la URL de tu backend Laravel
  withCredentials: true, // necesario para que envíe cookies (Sanctum)
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ⬇️ Este interceptor permite que los errores lleguen al catch del Login
api.interceptors.response.use(
  response => response,
  error => Promise.reject(error)
);

export default api;
