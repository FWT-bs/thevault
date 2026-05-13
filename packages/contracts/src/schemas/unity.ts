import { z } from "zod";

// ---------------------------------------------------------------------------
// Identifiers
// ---------------------------------------------------------------------------

// Stable IDs the Unity host uses to pick a controller. Must match the keys
// registered in `GameRegistry.cs` on the Unity side.
export const UnityGameIdSchema = z.enum([
  "plinko",
  "high_low",
  "fruit_merge",
  "block_blast",
  "water_sort",
  "bricks_vs_balls",
  "blackjack",
]);

export type UnityGameId = z.infer<typeof UnityGameIdSchema>;

// ---------------------------------------------------------------------------
// React Native → Unity: launch config
// ---------------------------------------------------------------------------

export const UnityGameConfigSchema = z.object({
  gameId: UnityGameIdSchema,
  sessionId: z.string().min(1),
  userId: z.string().min(1),
  difficulty: z.enum(["easy", "normal", "hard"]).default("normal"),
  seed: z.number().int().nonnegative(),
  // Free-form per-game tuning; backend may include level definitions, ad
  // boost multipliers, etc. Keep flat & JSON-serialisable.
  settings: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).default({}),
});

export type UnityGameConfig = z.infer<typeof UnityGameConfigSchema>;

// ---------------------------------------------------------------------------
// Unity → React Native: result + lifecycle messages
// ---------------------------------------------------------------------------

export const UnityGameResultSummarySchema = z
  .object({
    level: z.number().int().nonnegative().optional(),
    mistakes: z.number().int().nonnegative().optional(),
    coinsCollected: z.number().int().nonnegative().optional(),
  })
  .catchall(z.union([z.string(), z.number(), z.boolean()]));

export type UnityGameResultSummary = z.infer<typeof UnityGameResultSummarySchema>;

export const UnityGameFinishedMessageSchema = z.object({
  type: z.literal("GAME_FINISHED"),
  gameId: UnityGameIdSchema,
  sessionId: z.string().min(1),
  score: z.number().int().nonnegative(),
  durationMs: z.number().int().nonnegative(),
  won: z.boolean(),
  // Client signals eligibility; backend re-validates against sanity bounds
  // before granting any reward.
  rewardEligible: z.boolean(),
  // Optional integrity hash of the event stream that produced the score.
  // Backend may verify when seeded randomness is enabled.
  eventsHash: z.string().optional(),
  summary: UnityGameResultSummarySchema.optional(),
});

export type UnityGameFinishedMessage = z.infer<typeof UnityGameFinishedMessageSchema>;

export const UnityGameExitedMessageSchema = z.object({
  type: z.literal("GAME_EXITED"),
  gameId: UnityGameIdSchema,
  sessionId: z.string().min(1),
});

export type UnityGameExitedMessage = z.infer<typeof UnityGameExitedMessageSchema>;

export const UnityGameReadyMessageSchema = z.object({
  type: z.literal("GAME_READY"),
  gameId: UnityGameIdSchema,
  sessionId: z.string().min(1),
});

export type UnityGameReadyMessage = z.infer<typeof UnityGameReadyMessageSchema>;

export const UnityGameErrorMessageSchema = z.object({
  type: z.literal("GAME_ERROR"),
  gameId: UnityGameIdSchema.optional(),
  sessionId: z.string().optional(),
  code: z.string(),
  message: z.string(),
});

export type UnityGameErrorMessage = z.infer<typeof UnityGameErrorMessageSchema>;

export const UnityMessageSchema = z.discriminatedUnion("type", [
  UnityGameFinishedMessageSchema,
  UnityGameExitedMessageSchema,
  UnityGameReadyMessageSchema,
  UnityGameErrorMessageSchema,
]);

export type UnityMessage = z.infer<typeof UnityMessageSchema>;

// ---------------------------------------------------------------------------
// Server-side sanity bounds (used by /api/gameplay/complete to reject
// implausible client scores before paying out rewards).
// ---------------------------------------------------------------------------

export const UnityGameBoundsSchema = z.object({
  gameId: UnityGameIdSchema,
  maxScore: z.number().int().positive(),
  minDurationMs: z.number().int().nonnegative(),
  maxDurationMs: z.number().int().positive(),
});

export type UnityGameBounds = z.infer<typeof UnityGameBoundsSchema>;

// Conservative starter bounds. TUNE PER GAME before its Unity build ships:
// run a few honest rounds, set maxScore to ~1.5x the 99th-percentile, and
// align min/maxDurationMs with the real session envelope (Plinko rounds are
// short bursts; Block Blast / Water Sort can be long).
export const DEFAULT_UNITY_GAME_BOUNDS: Readonly<Record<UnityGameId, UnityGameBounds>> = {
  plinko:          { gameId: "plinko",          maxScore: 20_000, minDurationMs: 1_500,  maxDurationMs: 5 * 60_000 },
  high_low:        { gameId: "high_low",        maxScore: 50_000, minDurationMs: 1_000,  maxDurationMs: 10 * 60_000 },
  fruit_merge:     { gameId: "fruit_merge",     maxScore: 50_000, minDurationMs: 3_000,  maxDurationMs: 20 * 60_000 },
  block_blast:     { gameId: "block_blast",     maxScore: 100_000, minDurationMs: 3_000, maxDurationMs: 30 * 60_000 },
  water_sort:      { gameId: "water_sort",      maxScore: 10_000, minDurationMs: 2_000,  maxDurationMs: 20 * 60_000 },
  bricks_vs_balls: { gameId: "bricks_vs_balls", maxScore: 50_000, minDurationMs: 2_000,  maxDurationMs: 15 * 60_000 },
  blackjack:       { gameId: "blackjack",       maxScore: 100_000, minDurationMs: 1_000, maxDurationMs: 30 * 60_000 },
};
