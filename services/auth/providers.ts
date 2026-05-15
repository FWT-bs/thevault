import * as AppleAuthentication from "expo-apple-authentication";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

import { clearDevMegaSession } from "./devMega";

WebBrowser.maybeCompleteAuthSession();

// Auth backend was removed when we dropped Supabase. The provider hooks
// below stay in place so the existing UI keeps working, but they all
// resolve to a disabled response. Wire a new backend (e.g. Firebase) into
// these stubs to bring real auth back online.

const AUTH_DISABLED_MESSAGE =
  "Auth backend is not configured. Use the dev mega phone (__DEV__ only) to bypass.";

export const GOOGLE_AUTH_ENABLED = false;
export const isGoogleConfigured = GOOGLE_AUTH_ENABLED;

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

const disabled = (): AuthResult => ({ ok: false, message: AUTH_DISABLED_MESSAGE });

/* -------------------------------------------------------------------------- */
/* Phone OTP                                                                  */
/* -------------------------------------------------------------------------- */

export async function sendPhoneOtp(_rawPhone: string): Promise<AuthResult> {
  return disabled();
}

export async function verifyPhoneOtp(_rawPhone: string, _token: string): Promise<AuthResult> {
  return disabled();
}

/* -------------------------------------------------------------------------- */
/* Email OTP / magic link                                                     */
/* -------------------------------------------------------------------------- */

export async function sendEmailOtp(_email: string): Promise<AuthResult> {
  return disabled();
}

export async function verifyEmailOtp(_email: string, _token: string): Promise<AuthResult> {
  return disabled();
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
  if (Platform.OS !== "ios") {
    return { ok: false, message: "Apple sign-in is only available on iOS in this build." };
  }
  return disabled();
}

/* -------------------------------------------------------------------------- */
/* Google                                                                     */
/* -------------------------------------------------------------------------- */

export function useGoogleAuth(): GoogleAuthHookValue {
  return {
    ready: false,
    response: undefined,
    promptAsync: async () => ({ type: "dismiss" as const }),
  };
}

export async function completeGoogleSignIn(_idToken: string | undefined): Promise<AuthResult> {
  return disabled();
}

/* -------------------------------------------------------------------------- */
/* Session helpers                                                            */
/* -------------------------------------------------------------------------- */

export async function signOut(): Promise<AuthResult> {
  await clearDevMegaSession();
  return { ok: true };
}

export async function markOnboardingComplete(): Promise<AuthResult> {
  // Onboarding state lives on the dev mega session today; nothing to persist.
  return { ok: true };
}

export { AuthSession };
