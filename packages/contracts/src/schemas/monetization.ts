import { z } from "zod";

import { ApiSuccessSchema, IsoDateSchema, UUIDSchema } from "./common";
import { VaultTierIdSchema } from "./tiers";

export const AdDecisionSchema = z.object({
  placement: z.string(),
  eligible: z.boolean(),
  adType: z.enum(["rewarded", "interstitial", "native"]),
  cooldownSeconds: z.number().int(),
  estimatedRevenueUsd: z.number(),
  estimatedRewardUsd: z.number(),
  revenueShareBps: z.number().int().min(0).max(10_000),
  tier: VaultTierIdSchema,
  capRemainingUsd: z.number(),
  rewardCredits: z.number().int(),
});

export const RewardedAdGrantSchema = z.object({
  id: UUIDSchema,
  userId: UUIDSchema,
  placement: z.string(),
  adNetworkRef: z.string(),
  impressionId: UUIDSchema,
  rewardEntryId: UUIDSchema,
  tier: VaultTierIdSchema,
  revenueShareBps: z.number().int().min(0).max(10_000),
  estimatedAdRevenueUsd: z.number(),
  estimatedRewardUsd: z.number(),
  estimatedRewardCredits: z.number().int(),
  status: z.enum(["pending", "confirmed", "reversed"]),
  grantedAt: IsoDateSchema,
});

export const AdDecisionResponseSchema = ApiSuccessSchema(
  z.object({
    decision: AdDecisionSchema,
  }),
);

export const RewardedAdGrantResponseSchema = ApiSuccessSchema(
  z.object({
    grant: RewardedAdGrantSchema,
  }),
);

export type AdDecision = z.infer<typeof AdDecisionSchema>;
export type RewardedAdGrant = z.infer<typeof RewardedAdGrantSchema>;
