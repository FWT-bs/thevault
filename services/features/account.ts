import { supabase } from "../supabase/client";

let signInPromise: Promise<string | null> | null = null;

async function readCurrentToken(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function getAccountAccessToken(): Promise<string | null> {
  const existing = await readCurrentToken();
  if (existing) return existing;
  if (!supabase) return null;

  signInPromise ??= supabase.auth
    .signInAnonymously()
    .then(({ data, error }) => {
      if (error) {
        console.warn("Supabase anonymous sign-in failed", error.message);
        return null;
      }
      return data.session?.access_token ?? null;
    })
    .finally(() => {
      signInPromise = null;
    });

  return signInPromise;
}
