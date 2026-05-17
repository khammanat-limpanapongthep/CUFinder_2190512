import { api } from "./client";
import type { User } from "../types";

export const authApi = {
  logout: () => api<void>("/api/auth/logout", { method: "POST" }),
  me: () => api<User>("/api/auth/me"),
};
