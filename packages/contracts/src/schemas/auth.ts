import { z } from "zod";

import { ApiSuccessSchema, UUIDSchema } from "./common";
import { VaultTierIdSchema } from "./tiers";

export const UserProfileSchema = z.object({
  id: UUIDSchema,
  displayName: z.string(),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  tier: VaultTierIdSchema.default("starter"),
  kycStatus: z.enum(["none", "pending", "verified", "rejected"]).default("none"),
});

export const MeResponseSchema = ApiSuccessSchema(
  z.object({
    user: UserProfileSchema,
  }),
);

export type UserProfile = z.infer<typeof UserProfileSchema>;
