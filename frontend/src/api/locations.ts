import { api } from "./client";
import type { Location } from "../types";

export const locationsApi = {
  list: () =>
    api<{ locations: Location[] }>("/api/locations").then((r) => r.locations),
  create: (name: string, is_dropoff = true) =>
    api<Location>("/api/locations", {
      method: "POST",
      body: { name, is_dropoff },
    }),
  update: (id: string, patch: Partial<Pick<Location, "name" | "is_dropoff" | "is_active">>) =>
    api<Location>(`/api/locations/${id}`, { method: "PATCH", body: patch }),
  remove: (id: string) =>
    api<void>(`/api/locations/${id}`, { method: "DELETE" }),
};
