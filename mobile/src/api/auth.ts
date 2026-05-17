import client from "./client";

export interface Me {
  id: string;
  email: string;
  display_name: string;
  role: string;
}

export async function getMe(): Promise<Me | null> {
  try {
    const res = await client.get("/api/auth/me");
    return res.data;
  } catch {
    return null;
  }
}
