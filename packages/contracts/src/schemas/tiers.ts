import { z } from "zod";

import { ApiSuccessSchema, IsoDateSchema, UUIDSchema } from "./common";

export const VaultTierIdSchema = z.enum(["starter", "bronze", "silver", "gold", "platinum", "diamond"]);

export const VaultTierSchema = z.object({
  id: VaultTierIdSchema,
  name: z.string(),
  shortName: z.string(),
  revenueShareBps: z.number().int().min(0).max(10_000),
  dailyEarningCapUsd: z.number(),
  dailyRewardedAdLimit: z.number().int(),
  firstRedemptionDelay: z.string(),
  laterRedemptionDelay: z.string(),
  temporary: z.boolean(),
  requirements: z.array(z.string()),
  benefits: z.array(z.string()),
});

export const VaultLevelRequirementSchema = z.object({
  id: z.string(),
  label: z.string(),
  complete: z.boolean(),
  current: z.number().nullable(),
  target: z.number().nullable(),
});

export const VaultLevelStatusSchema = z.object({
  userId: UUIDSchema,
  currentTier: VaultTierSchema,
  nextTier: VaultTierSchema.nullable(),
  revenueShareBps: z.number().int().min(0).max(10_000),
  progressToNext: z.number().min(0).max(1),
  dailyEarningCapUsd: z.number(),
  dailyRewardedAdLimit: z.number().int(),
  adsWatchedToday: z.number().int(),
  earningsTodayUsd: z.number(),
  capRemainingUsd: z.number(),
  activeDays: z.number().int(),
  lifetimeVerifiedAds: z.number().int(),
  cleanActivityDays: z.number().int(),
  successfulRedemptions: z.number().int(),
  trustScore: z.number().int().min(0).max(100),
  trustState: z.enum(["building", "trusted", "vip", "review"]),
  tierStartedAt: IsoDateSchema,
  tierExpiresAt: IsoDateSchema.nullable(),
  requirements: z.array(VaultLevelRequirementSchema),
});

export const VaultLevelStatusResponseSchema = ApiSuccessSchema(
  z.object({
    vaultLevel: VaultLevelStatusSchema,
  }),
);

export type VaultTierId = z.infer<typeof VaultTierIdSchema>;
export type VaultTier = z.infer<typeof VaultTierSchema>;
export type VaultLevelRequirement = z.infer<typeof VaultLevelRequirementSchema>;
export type VaultLevelStatus = z.infer<typeof VaultLevelStatusSchema>;
