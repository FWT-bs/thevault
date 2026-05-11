import type { VercelRequest } from "@vercel/node";

import { getSupabaseAdmin, isSupabaseConfigured, MOCK_USER_ID } from "./supabase";

export function getMockUserId(req: VercelRequest): string {
  const user = req.headers["x-user-id"];
  if (Array.isArray(user)) return user[0] ?? MOCK_USER_ID;
  return user ?? MOCK_USER_ID;
}

function getBearerToken(req: VercelRequest): string | null {
  const value = req.headers.authorization;
  const header = Array.isArray(value) ? value[0] : value;
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim() || null;
}

export async function getRequestUserId(req: VercelRequest): Promise<string> {
  const token = getBearerToken(req);
  if (!token || !isSupabaseConfigured()) return getMockUserId(req);

  const {
    data: { user },
    error,
  } = await getSupabaseAdmin().auth.getUser(token);

  if (error || !user) {
    throw new Error("Invalid Supabase session");
  }

  return user.id;
}
