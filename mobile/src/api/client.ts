import axios from "axios";

export const BASE_URL = "https://cufinder-backend.onrender.com";

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

export default client;
