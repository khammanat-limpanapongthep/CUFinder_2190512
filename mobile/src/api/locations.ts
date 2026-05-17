import client from "./client";
import type { Location } from "../types";

export async function listLocations(): Promise<Location[]> {
  const res = await client.get("/api/locations");
  return res.data.locations;
}
