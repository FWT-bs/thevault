import { calculateRevenueShareReward } from "@thevault/domain";

import { monetizationConfig } from "../config/monetization";
import { vaultLevelRepository, walletRepository } from "../repositories";

export class MonetizationService {
  async adDecision(input: { placement: string; userId: string; sessionDepth?: number }) {
    const vaultLevel = await vaultLevelRepository.getStatus(input.userId);
    const eligible =
      (input.sessionDepth ?? 0) >= 0 &&
      vaultLevel.adsWatchedToday < vaultLevel.dailyRewardedAdLimit &&
      vaultLevel.capRemainingUsd > 0;
    const estimatedRevenueUsd = monetizationConfig.defaultRewardedAdRevenueUsd;
    const estimatedRewardUsd = calculateRevenueShareReward({
      revenueUsd: estimatedRevenueUsd,
      revenueShareBps: vaultLevel.revenueShareBps,
      capRemainingUsd: vaultLevel.capRemainingUsd,
    });
    return {
      placement: input.placement,
      eligible,
      adType: "rewarded",
      cooldownSeconds: 45,
      estimatedRevenueUsd,
      estimatedRewardUsd,
      revenueShareBps: vaultLevel.revenueShareBps,
      tier: vaultLevel.currentTier.id,
      capRemainingUsd: vaultLevel.capRemainingUsd,
      rewardCredits: Math.round(estimatedRewardUsd * monetizationConfig.baseCrPerUsd),
    };
  }

  async rewardedGrant(input: { userId: string; placement: string; adNetworkRef: string; estimatedRevenueUsd?: number }) {
    const vaultLevel = await vaultLevelRepository.getStatus(input.userId);
    if (vaultLevel.adsWatchedToday >= vaultLevel.dailyRewardedAdLimit || vaultLevel.capRemainingUsd <= 0) {
      throw new Error("Daily rewarded-ad limit reached for current Vault Level");
    }
    const estimatedAdRevenueUsd = input.estimatedRevenueUsd ?? monetizationConfig.defaultRewardedAdRevenueUsd;
    const estimatedRewardUsd = calculateRevenueShareReward({
      revenueUsd: estimatedAdRevenueUsd,
      revenueShareBps: vaultLevel.revenueShareBps,
      capRemainingUsd: vaultLevel.capRemainingUsd,
    });
    const estimatedRewardCredits = Math.round(estimatedRewardUsd * monetizationConfig.baseCrPerUsd);
    const grant = {
      id: crypto.randomUUID(),
      userId: input.userId,
      placement: input.placement,
      adNetworkRef: input.adNetworkRef,
      impressionId: crypto.randomUUID(),
      rewardEntryId: crypto.randomUUID(),
      tier: vaultLevel.currentTier.id,
      revenueShareBps: vaultLevel.revenueShareBps,
      estimatedAdRevenueUsd,
      estimatedRewardUsd,
      estimatedRewardCredits,
      status: "pending" as const,
      grantedAt: new Date().toISOString(),
    };
    await walletRepository.applyPendingAdReward({
      userId: input.userId,
      credits: estimatedRewardCredits,
      estimatedRewardUsd,
      estimatedRevenueUsd: estimatedAdRevenueUsd,
      title: "Rewarded ad pending",
      detail: `Estimated ad revenue $${estimatedAdRevenueUsd.toFixed(4)} · ${vaultLevel.currentTier.shortName} share ${vaultLevel.revenueShareBps / 100}%`,
    });
    await vaultLevelRepository.recordRewardedAd(grant);
    return grant;
  }

  async payoutGuardrails(input: { amountUsd: number; riskLevel: "allow" | "review" | "block"; method?: string }) {
    const method = input.method ?? "gift_card";
    const minPayoutUsd =
      method === "paypal" || method === "bank" || method === "venmo"
        ? monetizationConfig.cashMinCashoutUsd
        : monetizationConfig.giftCardMinCashoutUsd;
    return {
      minPayoutUsd,
      passesMin: input.amountUsd >= minPayoutUsd,
      reviewRequired: input.riskLevel !== "allow",
      firstWithdrawalHold: input.riskLevel === "allow" ? "1-3 days" : "Manual review",
    };
  }
}
