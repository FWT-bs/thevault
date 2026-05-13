import * as AppleAuthentication from "expo-apple-authentication";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

import { clearDevMegaSession } from "./devMega";
import { supabase } from "../supabase/client";

WebBrowser.maybeCompleteAuthSession();

/**
 * Google sign-in is temporarily disabled (avoids native client id / Metro issues).
 * Set to `true` when re-enabling; you will need valid `EXPO_PUBLIC_GOOGLE_*` env vars
 * and to restore `expo-auth-session/providers/google` in this file.
 */
export const GOOGLE_AUTH_ENABLED = false;

export const isGoogleConfigured = GOOGLE_AUTH_ENABLED;

// The stubbed hook always returns response: undefined today, but consumers
// (app/index.tsx) read .type and .params off the response when the real
// Google auth-session flow is wired up. Typing the union explicitly lets
// those reads compile without `as any`.
export type GoogleAuthResponse =
  | { type: "success"; params?: { id_token?: string } }
  | { type: "cancel" | "dismiss" | "error"; params?: undefined };

export type GoogleAuthHookValue = {
  ready: boolean;
  response: GoogleAuthResponse | undefined;
  promptAsync: () => Promise<{ type: "dismiss" }>;
};

export type AuthResult =
  | { ok: true }
  | { ok: false; message: string; code?: string };

function ensureSupabase(): NonNullable<typeof supabase> {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local.",
    );
  }
  return supabase;
}

function normalizePhone(input: string): string {
  // Supabase expects E.164 ("+15551234567"). We accept "+1 555..." or raw
  // digits and normalize aggressively.
  const trimmed = input.trim();
  if (trimmed.startsWith("+")) return `+${trimmed.slice(1).replace(/\D/g, "")}`;
  return `+${trimmed.replace(/\D/g, "")}`;
}

/* -------------------------------------------------------------------------- */
/* Phone OTP                                                                  */
/* -------------------------------------------------------------------------- */

export async function sendPhoneOtp(rawPhone: string): Promise<AuthResult> {
  try {
    const client = ensureSupabase();
    const phone = normalizePhone(rawPhone);
    const { error } = await client.auth.signInWithOtp({
      phone,
      options: { shouldCreateUser: true },
    });
    if (error) return { ok: false, message: error.message, code: error.code };
    return { ok: true };
  } catch (error) {
    return { ok: false, message: (error as Error).message };
  }
}

export async function verifyPhoneOtp(
  rawPhone: string,
  token: string,
): Promise<AuthResult> {
  try {
    const client = ensureSupabase();
    const phone = normalizePhone(rawPhone);
    const { error } = await client.auth.verifyOtp({
      phone,
      token: token.trim(),
      type: "sms",
    });
    if (error) return { ok: false, message: error.message, code: error.code };
    return { ok: true };
  } catch (error) {
    return { ok: false, message: (error as Error).message };
  }
}

/* -------------------------------------------------------------------------- */
/* Email OTP / magic link                                                     */
/* -------------------------------------------------------------------------- */

export async function sendEmailOtp(email: string): Promise<AuthResult> {
  try {
    const client = ensureSupabase();
    const trimmed = email.trim().toLowerCase();
    const { error } = await client.auth.signInWithOtp({
      email: trimmed,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: undefined,
      },
    });
    if (error) return { ok: false, message: error.message, code: error.code };
    return { ok: true };
  } catch (error) {
    return { ok: false, message: (error as Error).message };
  }
}

export async function verifyEmailOtp(
  email: string,
  token: string,
): Promise<AuthResult> {
  try {
    const client = ensureSupabase();
    const trimmed = email.trim().toLowerCase();
    const { error } = await client.auth.verifyOtp({
      email: trimmed,
      token: token.trim(),
      type: "email",
    });
    if (error) return { ok: false, message: error.message, code: error.code };
    return { ok: true };
  } catch (error) {
    return { ok: false, message: (error as Error).message };
  }
}

/* -------------------------------------------------------------------------- */
/* Apple                                                                      */
/* -------------------------------------------------------------------------- */

export const isAppleSignInAvailable = async (): Promise<boolean> => {
  if (Platform.OS !== "ios") return false;
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
};

export async function signInWithApple(): Promise<AuthResult> {
  try {
    if (Platform.OS !== "ios") {
      return {
        ok: false,
        message: "Apple sign-in is only available on iOS in this build.",
      };
    }
    const client = ensureSupabase();
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!credential.identityToken) {
      return { ok: false, message: "Apple did not return an identity token." };
    }
    const { error } = await client.auth.signInWithIdToken({
      provider: "apple",
      token: credential.identityToken,
    });
    if (error) return { ok: false, message: error.message, code: error.code };
    return { ok: true };
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === "ERR_REQUEST_CANCELED" || code === "ERR_CANCELED") {
      return { ok: false, message: "Sign in cancelled.", code };
    }
    return { ok: false, message: (error as Error).message };
  }
}

/* -------------------------------------------------------------------------- */
/* Google                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Stub while {@link GOOGLE_AUTH_ENABLED} is false. Re-enable with env + expo Google provider.
 */
export function useGoogleAuth(): GoogleAuthHookValue {
  return {
    ready: false,
    response: undefined,
    promptAsync: async () => ({ type: "dismiss" as const }),
  };
}

/**
 * Exchanges a Google ID token (from the useGoogleAuth response) for a
 * Supabase session. Call this from a useEffect that watches the response.
 */
export async function completeGoogleSignIn(
  idToken: string | undefined,
): Promise<AuthResult> {
  try {
    if (!idToken) return { ok: false, message: "Google did not return an ID token." };
    const client = ensureSupabase();
    const { error } = await client.auth.signInWithIdToken({
      provider: "google",
      token: idToken,
    });
    if (error) return { ok: false, message: error.message, code: error.code };
    return { ok: true };
  } catch (error) {
    return { ok: false, message: (error as Error).message };
  }
}

/* -------------------------------------------------------------------------- */
/* Session helpers                                                            */
/* -------------------------------------------------------------------------- */

export async function signOut(): Promise<AuthResult> {
  try {
    await clearDevMegaSession();
    if (!supabase) return { ok: true };
    const { error } = await supabase.auth.signOut();
    if (error) return { ok: false, message: error.message };
    return { ok: true };
  } catch (error) {
    return { ok: false, message: (error as Error).message };
  }
}

export async function markOnboardingComplete(): Promise<AuthResult> {
  try {
    const client = ensureSupabase();
    const { error } = await client.auth.updateUser({
      data: { has_onboarded: true },
    });
    if (error) return { ok: false, message: error.message };
    return { ok: true };
  } catch (error) {
    return { ok: false, message: (error as Error).message };
  }
}

// Re-exported for callers that want to fall through to AuthSession (e.g.
// custom OAuth providers we don't have first-class support for yet).
export { AuthSession };
