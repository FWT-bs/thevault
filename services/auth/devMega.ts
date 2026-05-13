import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "__thevault_dev_mega_v1__";

/** Stable fake user id for API headers / wallet mocks (valid UUID v4 shape). */
export const DEV_MEGA_API_USER_ID = "00000000-0000-4000-8000-000000000001";

const listeners = new Set<() => void>();

function notify() {
  for (const fn of listeners) fn();
}

/** In-memory flag; kept in sync with AsyncStorage when hydrated or toggled. */
let inMemoryMega = false;

export function isDevMegaActive(): boolean {
  return typeof __DEV__ !== "undefined" && __DEV__ && inMemoryMega;
}

export function subscribeDevMega(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Dev-only: treat numbers whose last 10 digits are `0000000000` as the mega
 * bypass (e.g. +1 000-000-0000 → E.164 digits ending in ten zeros).
 */
export function isDevMegaPhone(raw: string): boolean {
  if (typeof __DEV__ === "undefined" || !__DEV__) return false;
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 10 && digits.slice(-10) === "0000000000";
}

export async function hydrateDevMegaFromStorage(): Promise<boolean> {
  if (typeof __DEV__ === "undefined" || !__DEV__) return false;
  try {
    const v = await AsyncStorage.getItem(STORAGE_KEY);
    inMemoryMega = v === "1";
  } catch {
    inMemoryMega = false;
  }
  return inMemoryMega;
}

export async function activateDevMegaSession(): Promise<void> {
  if (typeof __DEV__ === "undefined" || !__DEV__) return;
  inMemoryMega = true;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* still active in-memory */
  }
  notify();
}

export async function clearDevMegaSession(): Promise<void> {
  inMemoryMega = false;
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  notify();
}
