import { isDevMegaActive } from "../auth/devMega";

// Auth backend was removed. Without an external token store the API
// client falls back to the dev mega user header path.
export async function getAccountAccessToken(): Promise<string | null> {
  if (isDevMegaActive()) return null;
  return null;
}
