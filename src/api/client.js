import axios from "axios";

// Single source of truth for the backend URL.
// Set VITE_API_URL in .env (local) or in your Vercel project settings (production)
// e.g. VITE_API_URL=https://your-backend.onrender.com
const baseURL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach the auth token automatically, if present, so pages don't have to.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
