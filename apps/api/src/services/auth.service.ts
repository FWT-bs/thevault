import type { UserProfile } from "@thevault/contracts";

import { getSupabaseAdmin, isMockUserId, isSupabaseConfigured } from "../lib/supabase";
import { vaultLevelRepository } from "../repositories";

export class AuthService {
  async me(userId: string): Promise<UserProfile> {
    if (isSupabaseConfigured() && !isMockUserId(userId)) {
      const [profileResult, userResult, vaultLevel] = await Promise.all([
        getSupabaseAdmin().from("profiles").select("*").eq("user_id", userId).maybeSingle(),
        getSupabaseAdmin().auth.admin.getUserById(userId),
        vaultLevelRepository.getStatus(userId),
      ]);

      if (profileResult.error) throw new Error(profileResult.error.message);
      if (userResult.error) throw new Error(userResult.error.message);

      const profile = profileResult.data;
      return {
        id: userId,
        displayName: profile?.display_name ?? "Player",
        email: userResult.data.user?.email ?? null,
        phone: profile?.phone ?? userResult.data.user?.phone ?? null,
        tier: vaultLevel.currentTier.id,
        kycStatus: profile?.kyc_status ?? "none",
      };
    }

    return {
      id: userId,
      displayName: "Player",
      email: null,
      phone: null,
      tier: "starter" as const,
      kycStatus: "none" as const,
    };
  }
}
