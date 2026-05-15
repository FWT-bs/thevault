import type { UserProfile } from "@thevault/contracts";

import { vaultLevelRepository } from "../repositories";

export class AuthService {
  async me(userId: string): Promise<UserProfile> {
    const vaultLevel = await vaultLevelRepository.getStatus(userId);
    return {
      id: userId,
      displayName: "Player",
      email: null,
      phone: null,
      tier: vaultLevel.currentTier.id,
      kycStatus: "none" as const,
    };
  }
}
