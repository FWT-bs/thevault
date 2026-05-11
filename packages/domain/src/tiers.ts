export type VaultTierId = "starter" | "bronze" | "silver" | "gold" | "platinum" | "diamond";

export type VaultTier = {
  id: VaultTierId;
  order: number;
  name: string;
  shortName: string;
  revenueShareBps: number;
  dailyEarningCapUsd: number;
  dailyRewardedAdLimit: number;
  firstRedemptionDelay: string;
  laterRedemptionDelay: string;
  temporary: boolean;
  requirements: string[];
  benefits: string[];
};

export const VAULT_TIERS: readonly VaultTier[] = [
  {
    id: "starter",
    order: 0,
    name: "Starter",
    shortName: "Starter",
    revenueShareBps: 3000,
    dailyEarningCapUsd: 0.5,
    dailyRewardedAdLimit: 20,
    firstRedemptionDelay: "Locked",
    laterRedemptionDelay: "Locked",
    temporary: false,
    requirements: ["Create your account"],
    benefits: ["30% verified ad revenue share", "Starter earning cap", "Basic streak rewards"],
  },
  {
    id: "bronze",
    order: 1,
    name: "Bronze Vault Member",
    shortName: "Bronze",
    revenueShareBps: 3500,
    dailyEarningCapUsd: 1,
    dailyRewardedAdLimit: 40,
    firstRedemptionDelay: "7 days",
    laterRedemptionDelay: "3-5 days",
    temporary: false,
    requirements: ["3 active earning days", "25 verified rewarded ads", "Email verified", "No fraud flags"],
    benefits: ["35% verified ad revenue share", "Offerwall unlock", "Higher daily cap"],
  },
  {
    id: "silver",
    order: 2,
    name: "Silver Vault Member",
    shortName: "Silver",
    revenueShareBps: 4000,
    dailyEarningCapUsd: 2.5,
    dailyRewardedAdLimit: 75,
    firstRedemptionDelay: "3-5 days",
    laterRedemptionDelay: "1-3 days",
    temporary: false,
    requirements: [
      "7 active earning days",
      "100 verified rewarded ads",
      "Phone or device verified",
      "Complete one offer or game milestone",
    ],
    benefits: ["40% verified ad revenue share", "Boosted daily games", "Lower redemption delay"],
  },
  {
    id: "gold",
    order: 3,
    name: "Gold Vault Member",
    shortName: "Gold",
    revenueShareBps: 4500,
    dailyEarningCapUsd: 5,
    dailyRewardedAdLimit: 125,
    firstRedemptionDelay: "24-48 hours",
    laterRedemptionDelay: "Same or next day",
    temporary: false,
    requirements: [
      "21 active earning days",
      "300 verified rewarded ads",
      "First successful redemption",
      "Clean device and IP history",
    ],
    benefits: ["45% verified ad revenue share", "Premium offers", "Faster redemption review"],
  },
  {
    id: "platinum",
    order: 4,
    name: "Platinum Vault Member",
    shortName: "Platinum",
    revenueShareBps: 5000,
    dailyEarningCapUsd: 10,
    dailyRewardedAdLimit: 200,
    firstRedemptionDelay: "Same day possible",
    laterRedemptionDelay: "Priority",
    temporary: false,
    requirements: [
      "45-60 active earning days",
      "750 verified rewarded ads",
      "Multiple successful redemptions",
      "Low-risk account history",
    ],
    benefits: ["50% verified ad revenue share", "Priority payout queue", "Best gift card rates"],
  },
  {
    id: "diamond",
    order: 5,
    name: "Diamond Boost",
    shortName: "Diamond",
    revenueShareBps: 6000,
    dailyEarningCapUsd: 25,
    dailyRewardedAdLimit: 260,
    firstRedemptionDelay: "Campaign rules",
    laterRedemptionDelay: "Campaign rules",
    temporary: true,
    requirements: ["Limited-time campaign invite"],
    benefits: ["55-60% promotional ad revenue share", "Launch and seasonal boosts", "Sponsored campaign access"],
  },
] as const;

export function getVaultTier(id: VaultTierId): VaultTier {
  return VAULT_TIERS.find((tier) => tier.id === id) ?? VAULT_TIERS[0];
}

export function getNextVaultTier(id: VaultTierId): VaultTier | null {
  const current = getVaultTier(id);
  return VAULT_TIERS.find((tier) => !tier.temporary && tier.order === current.order + 1) ?? null;
}

export function bpsToPercent(bps: number): number {
  return bps / 100;
}

export function formatSharePercent(bps: number): string {
  const pct = bpsToPercent(bps);
  return Number.isInteger(pct) ? `${pct}%` : `${pct.toFixed(1)}%`;
}

export function calculateRevenueShareReward(input: {
  revenueUsd: number;
  revenueShareBps: number;
  capRemainingUsd?: number;
}): number {
  const rawReward = (input.revenueUsd * input.revenueShareBps) / 10_000;
  const cappedReward =
    typeof input.capRemainingUsd === "number" ? Math.min(rawReward, Math.max(input.capRemainingUsd, 0)) : rawReward;
  return Math.max(0, Math.round(cappedReward * 10_000) / 10_000);
}

export function tierProgress(input: {
  tier: VaultTierId;
  activeDays: number;
  verifiedAds: number;
  successfulRedemptions: number;
  cleanActivityDays: number;
}): number {
  const next = getNextVaultTier(input.tier);
  if (!next) return 1;

  const goals: Record<VaultTierId, { activeDays: number; verifiedAds: number; successfulRedemptions: number; cleanActivityDays: number }> = {
    starter: { activeDays: 3, verifiedAds: 25, successfulRedemptions: 0, cleanActivityDays: 3 },
    bronze: { activeDays: 7, verifiedAds: 100, successfulRedemptions: 0, cleanActivityDays: 7 },
    silver: { activeDays: 21, verifiedAds: 300, successfulRedemptions: 1, cleanActivityDays: 14 },
    gold: { activeDays: 60, verifiedAds: 750, successfulRedemptions: 2, cleanActivityDays: 30 },
    platinum: { activeDays: 60, verifiedAds: 750, successfulRedemptions: 2, cleanActivityDays: 30 },
    diamond: { activeDays: 60, verifiedAds: 750, successfulRedemptions: 2, cleanActivityDays: 30 },
  };
  const goal = goals[input.tier];
  const parts = [
    Math.min(input.activeDays / goal.activeDays, 1),
    Math.min(input.verifiedAds / goal.verifiedAds, 1),
    goal.successfulRedemptions === 0
      ? 1
      : Math.min(input.successfulRedemptions / goal.successfulRedemptions, 1),
    Math.min(input.cleanActivityDays / goal.cleanActivityDays, 1),
  ];
  return Math.round((parts.reduce((sum, part) => sum + part, 0) / parts.length) * 100) / 100;
}
