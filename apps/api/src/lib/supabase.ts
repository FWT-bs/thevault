// Supabase has been removed. This module survives only to keep the
// MOCK_USER_ID + isMockUserId helpers in one place; importers use them
// to identify the local in-memory user.

export const MOCK_USER_ID = "00000000-0000-0000-0000-000000000001";

export function isMockUserId(userId: string): boolean {
  return userId === MOCK_USER_ID;
}

export function isSupabaseConfigured(): boolean {
  return false;
}
