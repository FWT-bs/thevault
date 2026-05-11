import { z } from "zod";

import { ApiSuccessSchema, CurrencyCodeSchema, IsoDateSchema, UUIDSchema } from "./common";
import { VaultTierIdSchema } from "./tiers";

export const WalletBalanceSchema = z.object({
  userId: UUIDSchema,
  credits: z.number().int(),
  usdBalance: z.number(),
  availableCredits: z.number().int(),
  availableUsd: z.number(),
  pendingCredits: z.number().int(),
  pendingUsd: z.number(),
  lockedCredits: z.number().int(),
  lockedUsd: z.number(),
  lifetimeGeneratedUsd: z.number(),
  lifetimeEarnedUsd: z.number(),
  currentTier: VaultTierIdSchema,
  currentShareBps: z.number().int().min(0).max(10_000),
  fxRateCrPerUsd: z.number().int(),
  updatedAt: IsoDateSchema,
});

export const WalletTransactionSchema = z.object({
  id: UUIDSchema,
  kind: z.enum(["in", "out", "bonus"]),
  amount: z.number(),
  currency: CurrencyCodeSchema,
  title: z.string(),
  detail: z.string(),
  status: z.enum(["pending", "processing", "completed", "failed", "review", "reversed"]),
  occurredAt: IsoDateSchema,
});

export const WalletBalanceResponseSchema = ApiSuccessSchema(
  z.object({
    wallet: WalletBalanceSchema,
  }),
);

export const WalletTransactionsResponseSchema = ApiSuccessSchema(
  z.object({
    items: z.array(WalletTransactionSchema),
    nextCursor: z.string().nullable(),
  }),
);

export type WalletBalance = z.infer<typeof WalletBalanceSchema>;
export type WalletTransaction = z.infer<typeof WalletTransactionSchema>;
