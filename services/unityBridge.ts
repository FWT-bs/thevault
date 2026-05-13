import { Platform } from "react-native";

import {
  UnityGameConfigSchema,
  UnityMessageSchema,
  type UnityGameConfig,
  type UnityMessage,
} from "@thevault/contracts";

// The GameObject name in Unity that exposes the inbound handlers. Must match
// the GameObject named "ReactNativeBridge" in UnityMiniGameHost.unity (see
// apps/unity-minigames/README.md).
export const UNITY_BRIDGE_GAMEOBJECT = "ReactNativeBridge";

// Methods on ReactNativeBridge.cs that React Native can target.
export const UNITY_BRIDGE_METHODS = {
  startGame: "OnStartGame",
  exitGame: "OnExitGame",
  pause: "OnPause",
  resume: "OnResume",
} as const;

// Minimal contract for the imperative handle returned by @azesmway's
// <UnityView ref={...} />. Typed locally so callers don't need the package's
// types at every site, and so we can swap implementations later.
export interface UnityViewHandle {
  postMessage: (gameObject: string, methodName: string, message: string) => void;
  unloadUnity: () => void;
  pauseUnity: (pause: boolean) => void;
  resumeUnity: () => void;
  windowFocusChanged?: (hasFocus: boolean) => void;
}

export type UnityNativeEvent = {
  nativeEvent: { message: string };
};

// ---------------------------------------------------------------------------
// Outbound: React Native → Unity
// ---------------------------------------------------------------------------

export function sendUnityConfig(view: UnityViewHandle | null, config: UnityGameConfig): void {
  if (!view) return;
  // Validate locally so we never push a malformed payload onto Unity's
  // JsonUtility, which silently nulls bad fields.
  const parsed = UnityGameConfigSchema.parse(config);
  view.postMessage(
    UNITY_BRIDGE_GAMEOBJECT,
    UNITY_BRIDGE_METHODS.startGame,
    JSON.stringify(parsed),
  );
}

export function sendUnityExit(view: UnityViewHandle | null, sessionId: string): void {
  if (!view) return;
  view.postMessage(UNITY_BRIDGE_GAMEOBJECT, UNITY_BRIDGE_METHODS.exitGame, sessionId);
}

export function sendUnityPause(view: UnityViewHandle | null): void {
  if (!view) return;
  view.pauseUnity(true);
  view.postMessage(UNITY_BRIDGE_GAMEOBJECT, UNITY_BRIDGE_METHODS.pause, "");
}

export function sendUnityResume(view: UnityViewHandle | null): void {
  if (!view) return;
  view.resumeUnity();
  view.postMessage(UNITY_BRIDGE_GAMEOBJECT, UNITY_BRIDGE_METHODS.resume, "");
}

// ---------------------------------------------------------------------------
// Inbound: Unity → React Native
// ---------------------------------------------------------------------------

export type ParsedUnityMessage =
  | { ok: true; message: UnityMessage }
  | { ok: false; raw: string; error: string };

export function parseUnityMessage(event: UnityNativeEvent): ParsedUnityMessage {
  const raw = event?.nativeEvent?.message ?? "";
  if (!raw) return { ok: false, raw, error: "empty payload" };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    return { ok: false, raw, error: `invalid JSON: ${(e as Error).message}` };
  }

  const result = UnityMessageSchema.safeParse(parsed);
  if (!result.success) {
    return { ok: false, raw, error: result.error.message };
  }
  return { ok: true, message: result.data };
}

// ---------------------------------------------------------------------------
// Capability probe
// ---------------------------------------------------------------------------

// Returns true when the native Unity module is expected to be available.
// @azesmway/react-native-unity needs a custom dev client; it cannot run in
// Expo Go or on web. Callers should use this to fall back to the existing
// React Native game implementations when Unity isn't reachable.
export function isUnityAvailable(): boolean {
  return Platform.OS === "ios" || Platform.OS === "android";
}
