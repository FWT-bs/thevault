import { z } from "zod";

import { ApiSuccessSchema, IsoDateSchema, UUIDSchema } from "./common";

export const StreakSummarySchema = z.object({
  userId: UUIDSchema,
  currentDays: z.number().int().nonnegative(),
  bonusPercent: z.number().int().nonnegative(),
  claimable: z.boolean(),
  lastClaimedAt: IsoDateSchema.nullable(),
});

export const ClaimStreakRequestSchema = z.object({
  idempotencyKey: z.string().min(8),
});

export const ClaimStreakResponseSchema = ApiSuccessSchema(
  z.object({
    awardedCredits: z.number().int(),
    streak: StreakSummarySchema,
  }),
);

export type StreakSummary = z.infer<typeof StreakSummarySchema>;
