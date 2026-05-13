import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { loadLocalEnv } from "./env";

loadLocalEnv();

let adminClient: SupabaseClient | null = null;

export const MOCK_USER_ID = "00000000-0000-0000-0000-000000000001";

export function isMockUserId(userId: string): boolean {
  return userId === MOCK_USER_ID;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && getSupabaseServerKey());
}

export function getSupabaseAdmin(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  const serverKey = getSupabaseServerKey();
  if (!serverKey) {
    throw new Error("Supabase server key is missing.");
  }

  adminClient ??= createClient(process.env.SUPABASE_URL as string, serverKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return adminClient;
}

function getSupabaseServerKey(): string | undefined {
  return process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
}
