import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL || "https://matrimonyapp-hwfm.onrender.com/api";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000  
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function imageUrl(path) {
  if (!path) return "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800";
  if (path.startsWith("http")) return path;
  return `${API_URL.replace("/api", "")}${path}`;
}
