import type { UnityGameId } from "@thevault/contracts";

const truthy = (value: string | undefined): boolean =>
  value === "true" || value === "1" || value === "yes";

export const FEATURE_FLAGS = {
  useUnityMinigames: truthy(process.env.EXPO_PUBLIC_USE_UNITY_MINIGAMES),
} as const;

// React Native uses dashed gameIds (e.g. "high-low", "block-blast"). The
// Unity-side enum uses underscored ids (matches the UnityGameIdSchema in
// packages/contracts). Map between them in one place.
const RN_TO_UNITY_GAME_ID: Readonly<Record<string, UnityGameId>> = {
  plinko: "plinko",
  "high-low": "high_low",
  "fruit-merge": "fruit_merge",
  "block-blast": "block_blast",
  "water-sorter": "water_sort",
  "bricks-vs-balls": "bricks_vs_balls",
  blackjack: "blackjack",
};

// Per-game opt-in. A game only goes through the Unity host if BOTH the
// global flag is on AND the game is listed here. This lets us migrate
// games one at a time without flipping every player onto an unfinished
// Unity build.
const UNITY_ENABLED_GAMES: ReadonlySet<UnityGameId> = new Set([
  // Add a UnityGameId here once its Unity controller is shippable.
  // e.g. "plinko",
]);

/** Translate an RN gameId to its Unity counterpart, or null if not supported. */
export function getUnityGameId(rnGameId: string): UnityGameId | null {
  return RN_TO_UNITY_GAME_ID[rnGameId] ?? null;
}

/** True when the given RN gameId should launch through the Unity host. */
export function isUnityGameEnabled(rnGameId: string): boolean {
  if (!FEATURE_FLAGS.useUnityMinigames) return false;
  const mapped = RN_TO_UNITY_GAME_ID[rnGameId];
  return mapped != null && UNITY_ENABLED_GAMES.has(mapped);
}
