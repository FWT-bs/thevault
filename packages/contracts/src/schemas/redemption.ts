import { z } from "zod";

import { ApiSuccessSchema, IsoDateSchema, UUIDSchema } from "./common";

export const RedemptionMethodSchema = z.enum(["gift_card", "paypal", "crypto"]);

export const CreateRedemptionRequestSchema = z.object({
  idempotencyKey: z.string().min(8),
  method: RedemptionMethodSchema,
  amountUsd: z.number().positive(),
  destination: z.string().min(2),
});

export const RedemptionStatusSchema = z.enum(["created", "review", "processing", "paid", "failed"]);

export const RedemptionSchema = z.object({
  id: UUIDSchema,
  userId: UUIDSchema,
  method: RedemptionMethodSchema,
  amountUsd: z.number(),
  creditsDebited: z.number().int(),
  destinationMasked: z.string(),
  status: RedemptionStatusSchema,
  createdAt: IsoDateSchema,
});

export const CreateRedemptionResponseSchema = ApiSuccessSchema(
  z.object({
    redemption: RedemptionSchema,
  }),
);

export type Redemption = z.infer<typeof RedemptionSchema>;
