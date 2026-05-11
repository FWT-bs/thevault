import {
  getNextVaultTier,
  getVaultTier,
  tierProgress,
  type VaultTier as DomainVaultTier,
} from "@thevault/domain";
import type {
  CatalogItem,
  Redemption,
  RewardedAdGrant,
  StreakSummary,
  VaultLevelRequirement,
  VaultLevelStatus,
  VaultTier,
  VaultTierId,
  WalletBalance,
  WalletTransaction,
} from "@thevault/contracts";

import type { CatalogRepository, RedemptionRepository, StreakRepository, VaultLevelRepository, WalletRepository } from "./interfaces";

const balances = new Map<string, WalletBalance>();
const transactions = new Map<string, WalletTransaction[]>();
const streaks = new Map<string, StreakSummary>();
const redemptions = new Map<string, Redemption[]>();
const vaultLevels = new Map<string, VaultLevelState>();

type VaultLevelState = {
  currentTier: VaultTierId;
  tierStartedAt: string;
  tierExpiresAt: string | null;
  activeDays: number;
  lifetimeVerifiedAds: number;
  cleanActivityDays: number;
  successfulRedemptions: number;
  adsWatchedToday: number;
  earningsTodayUsd: number;
  trustScore: number;
};

const catalog: CatalogItem[] = [
  { id: "blackjack", title: "Blackjack", category: "in-app", rewardLabel: "8 CR/min", route: "/blackjack", active: true, badge: "Hot" },
  { id: "block-puzzle", title: "Block Puzzle", category: "in-app", rewardLabel: "12 CR/min", route: "/games-in-app", active: true, badge: "Live" },
  { id: "brand-pulse", title: "Brand Pulse Survey", category: "surveys", rewardLabel: "$2.20", route: "/offerwall", active: true, badge: "Hot" },
];

function toContractTier(tier: DomainVaultTier): VaultTier {
  return {
    id: tier.id,
    name: tier.name,
    shortName: tier.shortName,
    revenueShareBps: tier.revenueShareBps,
    dailyEarningCapUsd: tier.dailyEarningCapUsd,
    dailyRewardedAdLimit: tier.dailyRewardedAdLimit,
    firstRedemptionDelay: tier.firstRedemptionDelay,
    laterRedemptionDelay: tier.laterRedemptionDelay,
    temporary: tier.temporary,
    requirements: [...tier.requirements],
    benefits: [...tier.benefits],
  };
}

function ensureVaultState(userId: string): VaultLevelState {
  const existing = vaultLevels.get(userId);
  if (existing) return existing;
  const seeded: VaultLevelState = {
    currentTier: "starter",
    tierStartedAt: new Date().toISOString(),
    tierExpiresAt: null,
    activeDays: 0,
    lifetimeVerifiedAds: 0,
    cleanActivityDays: 0,
    successfulRedemptions: 0,
    adsWatchedToday: 0,
    earningsTodayUsd: 0,
    trustScore: 50,
  };
  vaultLevels.set(userId, seeded);
  return seeded;
}

function requirementsFor(state: VaultLevelState): VaultLevelRequirement[] {
  const next = getNextVaultTier(state.currentTier);
  if (!next) {
    return [
      { id: "max-tier", label: "Highest permanent share unlocked", complete: true, current: null, target: null },
    ];
  }

  const goals: Record<VaultTierId, { activeDays: number; verifiedAds: number; redemptions: number; cleanDays: number }> = {
    starter: { activeDays: 3, verifiedAds: 25, redemptions: 0, cleanDays: 3 },
    bronze: { activeDays: 7, verifiedAds: 100, redemptions: 0, cleanDays: 7 },
    silver: { activeDays: 21, verifiedAds: 300, redemptions: 1, cleanDays: 14 },
    gold: { activeDays: 60, verifiedAds: 750, redemptions: 2, cleanDays: 30 },
    platinum: { activeDays: 60, verifiedAds: 750, redemptions: 2, cleanDays: 30 },
    diamond: { activeDays: 60, verifiedAds: 750, redemptions: 2, cleanDays: 30 },
  };
  const goal = goals[state.currentTier];
  return [
    { id: "email", label: "Email verified", complete: true, current: null, target: null },
    { id: "active-days", label: `${goal.activeDays} active earning days`, complete: state.activeDays >= goal.activeDays, current: state.activeDays, target: goal.activeDays },
    { id: "verified-ads", label: `${goal.verifiedAds} verified rewarded ads`, complete: state.lifetimeVerifiedAds >= goal.verifiedAds, current: state.lifetimeVerifiedAds, target: goal.verifiedAds },
    { id: "clean-activity", label: `${goal.cleanDays} clean activity days`, complete: state.cleanActivityDays >= goal.cleanDays, current: state.cleanActivityDays, target: goal.cleanDays },
    {
      id: "redemptions",
      label: goal.redemptions === 0 ? `Reach ${next.shortName}` : `${goal.redemptions} successful redemption${goal.redemptions > 1 ? "s" : ""}`,
      complete: state.successfulRedemptions >= goal.redemptions,
      current: state.successfulRedemptions,
      target: goal.redemptions,
    },
  ];
}

function getVaultStatus(userId: string): VaultLevelStatus {
  const state = ensureVaultState(userId);
  const current = getVaultTier(state.currentTier);
  const next = getNextVaultTier(state.currentTier);
  return {
    userId,
    currentTier: toContractTier(current),
    nextTier: next ? toContractTier(next) : null,
    revenueShareBps: current.revenueShareBps,
    progressToNext: tierProgress({
      tier: state.currentTier,
      activeDays: state.activeDays,
      verifiedAds: state.lifetimeVerifiedAds,
      successfulRedemptions: state.successfulRedemptions,
      cleanActivityDays: state.cleanActivityDays,
    }),
    dailyEarningCapUsd: current.dailyEarningCapUsd,
    dailyRewardedAdLimit: current.dailyRewardedAdLimit,
    adsWatchedToday: state.adsWatchedToday,
    earningsTodayUsd: state.earningsTodayUsd,
    capRemainingUsd: Math.max(current.dailyEarningCapUsd - state.earningsTodayUsd, 0),
    activeDays: state.activeDays,
    lifetimeVerifiedAds: state.lifetimeVerifiedAds,
    cleanActivityDays: state.cleanActivityDays,
    successfulRedemptions: state.successfulRedemptions,
    trustScore: state.trustScore,
    trustState: state.trustScore >= 90 ? "vip" : state.trustScore >= 75 ? "trusted" : state.trustScore >= 45 ? "building" : "review",
    tierStartedAt: state.tierStartedAt,
    tierExpiresAt: state.tierExpiresAt,
    requirements: requirementsFor(state),
  };
}

function ensureWallet(userId: string): WalletBalance {
  const existing = balances.get(userId);
  if (existing) return existing;
  const vaultLevel = getVaultStatus(userId);
  const seeded: WalletBalance = {
    userId,
    credits: 0,
    usdBalance: 0,
    availableCredits: 0,
    availableUsd: 0,
    pendingCredits: 0,
    pendingUsd: 0,
    lockedCredits: 0,
    lockedUsd: 0,
    lifetimeGeneratedUsd: 0,
    lifetimeEarnedUsd: 0,
    currentTier: vaultLevel.currentTier.id,
    currentShareBps: vaultLevel.revenueShareBps,
    fxRateCrPerUsd: 100,
    updatedAt: new Date().toISOString(),
  };
  balances.set(userId, seeded);
  return seeded;
}

function ensureStreak(userId: string): StreakSummary {
  const existing = streaks.get(userId);
  if (existing) return existing;
  const seeded: StreakSummary = {
    userId,
    currentDays: 0,
    bonusPercent: 0,
    claimable: true,
    lastClaimedAt: null,
  };
  streaks.set(userId, seeded);
  return seeded;
}

function ensureTransactions(userId: string): WalletTransaction[] {
  const existing = transactions.get(userId);
  if (existing) return existing;
  const seeded: WalletTransaction[] = [];
  transactions.set(userId, seeded);
  return seeded;
}

export const walletRepository: WalletRepository = {
  async getBalance(userId) {
    return ensureWallet(userId);
  },
  async listTransactions(userId) {
    return ensureTransactions(userId);
  },
  async applyCredit(userId, credits, title, detail) {
    const bal = ensureWallet(userId);
    bal.availableCredits += credits;
    bal.availableUsd = bal.availableCredits / bal.fxRateCrPerUsd;
    bal.credits = bal.availableCredits;
    bal.usdBalance = bal.availableUsd;
    bal.lifetimeEarnedUsd += credits / bal.fxRateCrPerUsd;
    bal.updatedAt = new Date().toISOString();
    const txs = ensureTransactions(userId);
    txs.unshift({
      id: crypto.randomUUID(),
      kind: "in",
      amount: credits,
      currency: "CR",
      title,
      detail,
      status: "completed",
      occurredAt: new Date().toISOString(),
    });
    transactions.set(userId, txs);
  },
  async applyDebit(userId, credits, title, detail) {
    const bal = ensureWallet(userId);
    bal.availableCredits -= credits;
    bal.availableUsd = bal.availableCredits / bal.fxRateCrPerUsd;
    bal.credits = bal.availableCredits;
    bal.usdBalance = bal.availableUsd;
    bal.updatedAt = new Date().toISOString();
    const txs = ensureTransactions(userId);
    txs.unshift({
      id: crypto.randomUUID(),
      kind: "out",
      amount: credits,
      currency: "CR",
      title,
      detail,
      status: "processing",
      occurredAt: new Date().toISOString(),
    });
    transactions.set(userId, txs);
  },
  async applyPendingAdReward(input) {
    const bal = ensureWallet(input.userId);
    bal.pendingCredits += input.credits;
    bal.pendingUsd = bal.pendingCredits / bal.fxRateCrPerUsd;
    bal.lifetimeGeneratedUsd += input.estimatedRevenueUsd;
    bal.updatedAt = new Date().toISOString();
    const txs = ensureTransactions(input.userId);
    txs.unshift({
      id: crypto.randomUUID(),
      kind: "bonus",
      amount: input.credits,
      currency: "CR",
      title: input.title,
      detail: input.detail,
      status: "pending",
      occurredAt: new Date().toISOString(),
    });
    transactions.set(input.userId, txs);
  },
};

export const vaultLevelRepository: VaultLevelRepository = {
  async getStatus(userId) {
    return getVaultStatus(userId);
  },
  async recordRewardedAd(input) {
    const state = ensureVaultState(input.userId);
    state.adsWatchedToday += 1;
    state.earningsTodayUsd += input.estimatedRewardUsd;
    state.lifetimeVerifiedAds += input.status === "confirmed" ? 1 : 0;
    const wallet = ensureWallet(input.userId);
    wallet.currentTier = state.currentTier;
    wallet.currentShareBps = input.revenueShareBps;
    wallet.updatedAt = new Date().toISOString();
  },
};

export const streakRepository: StreakRepository = {
  async getSummary(userId) {
    return ensureStreak(userId);
  },
  async claim(userId, credits) {
    const summary = ensureStreak(userId);
    summary.claimable = false;
    summary.lastClaimedAt = new Date().toISOString();
    await walletRepository.applyCredit(userId, credits, "Daily streak bonus", `Day ${summary.currentDays}`);
    return summary;
  },
};

export const catalogRepository: CatalogRepository = {
  async listCatalog() {
    return catalog;
  },
};

export const redemptionRepository: RedemptionRepository = {
  async create(input) {
    const item: Redemption = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      status: "created",
      ...input,
    };
    const current = redemptions.get(input.userId) ?? [];
    current.unshift(item);
    redemptions.set(input.userId, current);
    return item;
  },
  async getByUser(userId) {
    return redemptions.get(userId) ?? [];
  },
};
