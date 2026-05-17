export type Role = "user" | "location_admin" | "web_admin";
export type ItemType = "lost" | "found";
export type ItemStatus = "open" | "claimed" | "disposed";

export interface Location {
  id: string;
  name: string;
  is_dropoff: boolean;
  is_active: boolean;
  created_at: string;
}

export interface BaseItem {
  id: string;
  type: ItemType;
  title: string;
  description: string;
  category: string;
  image_id: string | null;
  status: ItemStatus;
  posted_by: { id: string; display_name: string };
  posted_at: string;
}

export interface LostItem extends BaseItem {
  type: "lost";
  last_seen_location_id: string | null;
  last_seen_location_text: string | null;
  last_seen_date: string;
  contact_info: string | null;
}

export interface FoundItem extends BaseItem {
  type: "found";
  found_location_id: string | null;
  found_location_text: string | null;
  found_date: string;
  held_admin_location_id: string | null;
  held_freetext: string | null;
}

export type Item = LostItem | FoundItem;

export interface ItemListResponse {
  items: Item[];
  total: number;
}

export const CATEGORIES = [
  "ID Cards",
  "Electronics",
  "Wallet & Cards",
  "Keys",
  "Bags & Backpacks",
  "Books & Stationery",
  "Clothing & Accessories",
  "Water Bottles",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];
