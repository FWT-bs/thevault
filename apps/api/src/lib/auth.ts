import type { VercelRequest } from "@vercel/node";

import { MOCK_USER_ID } from "./supabase";

export function getMockUserId(req: VercelRequest): string {
  const user = req.headers["x-user-id"];
  if (Array.isArray(user)) return user[0] ?? MOCK_USER_ID;
  return user ?? MOCK_USER_ID;
}

export async function getRequestUserId(req: VercelRequest): Promise<string> {
  // Auth backend is gone; trust the x-user-id header (or fall back to mock).
  return getMockUserId(req);
}
