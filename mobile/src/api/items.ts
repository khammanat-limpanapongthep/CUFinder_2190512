import client, { BASE_URL } from "./client";
import type { Item, ItemListResponse, ItemType } from "../types";

export function imageUrl(imageId: string) {
  return `${BASE_URL}/api/images/${imageId}`;
}

export async function listItems(params: {
  type?: ItemType;
  category?: string;
  q?: string;
  status?: string;
  limit?: number;
  skip?: number;
}): Promise<ItemListResponse> {
  const res = await client.get("/api/items", { params });
  return res.data;
}

export async function getItem(id: string): Promise<Item> {
  const res = await client.get(`/api/items/${id}`);
  return res.data;
}

export async function createItem(data: Record<string, unknown>): Promise<Item> {
  const res = await client.post("/api/items", data);
  return res.data;
}
