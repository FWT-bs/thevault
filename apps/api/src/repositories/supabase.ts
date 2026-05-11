import {
  getNextVaultTier,
  getVaultTier,
  tierProgress,
  type VaultTier as DomainVaultTier,
} from "@thevault/domain";
import type {
  CatalogItem,
  Redemption,
  StreakSummary,
  VaultLevelRequirement,
  VaultLevelStatus,
  VaultTier,
  VaultTierId,
  WalletBalance,
  WalletTransaction,
} from "@thevault/contracts";

import { getSupabaseAdmin } from "../lib/supabase";
import type { CatalogRepository, RedemptionRepository, StreakRepository, VaultLevelRepository, WalletRepository } from "./interfaces";

type AnyRecord = Record<string, any>;

const DEFAULT_FX_CR_PER_USD = 100;
const DEFAULT_SHARE_BPS = 3000;

function numberFrom(value: unknown, fallback = 0): number {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") return Number(value);
  return fallback;
}

function iso(value: unknown): string {
  return typeof value === "string" ? value : new Date().toISOString();
}

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

function assertNoError<T extends { error: unknown }>(result: T): T {
  if (result.error) {
    const message = result.error instanceof Error ? result.error.message : "Supabase request failed";
    throw new Error(message);
  }
  return result;
}

async function ensureAccountRows(userId: string) {
  const supabase = getSupabaseAdmin();

  const defaults = [
    supabase.from("profiles").upsert(
      {
        user_id: userId,
        display_name: "Player",
        tier: "starter",
        kyc_status: "none",
      },
      { onConflict: "user_id", ignoreDuplicates: true },
    ),
    supabase.from("wallets").upsert(
      {
        user_id: userId,
        credits_balance: 0,
        usd_balance: 0,
        fx_cr_per_usd: DEFAULT_FX_CR_PER_USD,
        available_credits: 0,
        pending_credits: 0,
        locked_credits: 0,
        lifetime_generated_usd: 0,
        lifetime_earned_usd: 0,
        current_share_bps: DEFAULT_SHARE_BPS,
      },
      { onConflict: "user_id", ignoreDuplicates: true },
    ),
    supabase.from("streak_profiles").upsert(
      {
        user_id: userId,
        current_days: 0,
        best_days: 0,
        bonus_percent: 0,
      },
      { onConflict: "user_id", ignoreDuplicates: true },
    ),
    supabase.from("user_tiers").upsert(
      {
        user_id: userId,
        current_tier: "starter",
        revenue_share_bps: DEFAULT_SHARE_BPS,
        lifetime_verified_ads: 0,
        active_days: 0,
        clean_activity_days: 0,
        successful_redemptions: 0,
        trust_score: 50,
        ads_watched_today: 0,
        earnings_today_usd: 0,
      },
      { onConflict: "user_id", ignoreDuplicates: true },
    ),
  ];

  const results = await Promise.all(defaults);
  results.forEach(assertNoError);
}

async function getTierRow(userId: string): Promise<AnyRecord> {
  await ensureAccountRows(userId);
  const result = await getSupabaseAdmin()
    .from("user_tiers")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  assertNoError(result);
  return result.data ?? {};
}

async function getWalletRow(userId: string): Promise<AnyRecord> {
  await ensureAccountRows(userId);
  const result = await getSupabaseAdmin()
    .from("wallets")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  assertNoError(result);
  return result.data ?? {};
}

function zeroWallet(userId: string): WalletBalance {
  return {
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
    currentTier: "starter",
    currentShareBps: DEFAULT_SHARE_BPS,
    fxRateCrPerUsd: DEFAULT_FX_CR_PER_USD,
    updatedAt: new Date().toISOString(),
  };
}

function mapWallet(userId: string, wallet: AnyRecord, tier: AnyRecord): WalletBalance {
  const fx = numberFrom(wallet.fx_cr_per_usd, DEFAULT_FX_CR_PER_USD);
  const availableCredits = numberFrom(wallet.available_credits, numberFrom(wallet.credits_balance));
  const pendingCredits = numberFrom(wallet.pending_credits);
  const lockedCredits = numberFrom(wallet.locked_credits);
  const credits = numberFrom(wallet.credits_balance, availableCredits);
  const currentTier = (tier.current_tier ?? "starter") as VaultTierId;

  return {
    userId,
    credits,
    usdBalance: numberFrom(wallet.usd_balance, credits / fx),
    availableCredits,
    availableUsd: availableCredits / fx,
    pendingCredits,
    pendingUsd: pendingCredits / fx,
    lockedCredits,
    lockedUsd: lockedCredits / fx,
    lifetimeGeneratedUsd: numberFrom(wallet.lifetime_generated_usd),
    lifetimeEarnedUsd: numberFrom(wallet.lifetime_earned_usd),
    currentTier,
    currentShareBps: numberFrom(tier.revenue_share_bps, numberFrom(wallet.current_share_bps, DEFAULT_SHARE_BPS)),
    fxRateCrPerUsd: fx,
    updatedAt: iso(wallet.updated_at),
  };
}

function requirementsFor(state: {
  currentTier: VaultTierId;
  activeDays: number;
  lifetimeVerifiedAds: number;
  cleanActivityDays: number;
  successfulRedemptions: number;
}): VaultLevelRequirement[] {
  const next = getNextVaultTier(state.currentTier);
  if (!next) {
    return [{ id: "max-tier", label: "Highest permanent share unlocked", complete: true, current: null, target: null }];
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
    { id: "email", label: "Account created", complete: true, current: null, target: null },
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

function mapLedgerEntry(row: AnyRecord): WalletTransaction {
  const sourceType = String(row.source_type ?? "");
  const kind = row.kind === "debit" ? "out" : sourceType.includes("pending") ? "bonus" : row.kind === "adjustment" ? "bonus" : "in";
  const status = sourceType.includes("pending") ? "pending" : sourceType.includes("redemption") ? "processing" : "completed";

  return {
    id: row.id,
    kind,
    amount: numberFrom(row.amount_credits),
    currency: "CR",
    title: row.title,
    detail: row.detail ?? "",
    status,
    occurredAt: iso(row.created_at),
  };
}

async function updateWallet(userId: string, updater: (wallet: WalletBalance) => WalletBalance) {
  const current = await supabaseWalletRepository.getBalance(userId);
  const next = updater(current);

  const result = await getSupabaseAdmin()
    .from("wallets")
    .update({
      credits_balance: next.credits,
      usd_balance: next.usdBalance,
      available_credits: next.availableCredits,
      pending_credits: next.pendingCredits,
      locked_credits: next.lockedCredits,
      lifetime_generated_usd: next.lifetimeGeneratedUsd,
      lifetime_earned_usd: next.lifetimeEarnedUsd,
      current_share_bps: next.currentShareBps,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
  assertNoError(result);
}

async function insertLedgerEntry(input: {
  userId: string;
  kind: "credit" | "debit" | "adjustment";
  amountCredits: number;
  amountUsd: number;
  title: string;
  detail: string;
  sourceType: string;
  sourceId?: string;
}) {
  const result = await getSupabaseAdmin()
    .from("ledger_entries")
    .insert({
      user_id: input.userId,
      kind: input.kind,
      amount_credits: input.amountCredits,
      amount_usd: input.amountUsd,
      title: input.title,
      detail: input.detail,
      source_type: input.sourceType,
      source_id: input.sourceId ?? null,
    });
  assertNoError(result);
}

export const supabaseWalletRepository: WalletRepository = {
  async getBalance(userId) {
    const [wallet, tier] = await Promise.all([getWalletRow(userId), getTierRow(userId)]);
    if (!wallet.user_id) return zeroWallet(userId);
    return mapWallet(userId, wallet, tier);
  },
  async listTransactions(userId) {
    await ensureAccountRows(userId);
    const result = await getSupabaseAdmin()
      .from("ledger_entries")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    assertNoError(result);
    return (result.data ?? []).map(mapLedgerEntry);
  },
  async applyCredit(userId, credits, title, detail) {
    await updateWallet(userId, (wallet) => {
      const availableCredits = wallet.availableCredits + credits;
      const usd = availableCredits / wallet.fxRateCrPerUsd;
      return {
        ...wallet,
        credits: availableCredits,
        usdBalance: usd,
        availableCredits,
        availableUsd: usd,
        lifetimeEarnedUsd: wallet.lifetimeEarnedUsd + credits / wallet.fxRateCrPerUsd,
      };
    });
    await insertLedgerEntry({
      userId,
      kind: "credit",
      amountCredits: credits,
      amountUsd: credits / DEFAULT_FX_CR_PER_USD,
      title,
      detail,
      sourceType: "wallet_credit",
    });
  },
  async applyDebit(userId, credits, title, detail) {
    const wallet = await supabaseWalletRepository.getBalance(userId);
    if (wallet.availableCredits < credits) {
      throw new Error("Insufficient available credits");
    }

    await updateWallet(userId, (current) => {
      const availableCredits = current.availableCredits - credits;
      const usd = availableCredits / current.fxRateCrPerUsd;
      return {
        ...current,
        credits: availableCredits,
        usdBalance: usd,
        availableCredits,
        availableUsd: usd,
      };
    });
    await insertLedgerEntry({
      userId,
      kind: "debit",
      amountCredits: credits,
      amountUsd: credits / wallet.fxRateCrPerUsd,
      title,
      detail,
      sourceType: "redemption_debit",
    });
  },
  async applyPendingAdReward(input) {
    await updateWallet(input.userId, (wallet) => ({
      ...wallet,
      pendingCredits: wallet.pendingCredits + input.credits,
      pendingUsd: (wallet.pendingCredits + input.credits) / wallet.fxRateCrPerUsd,
      lifetimeGeneratedUsd: wallet.lifetimeGeneratedUsd + input.estimatedRevenueUsd,
    }));

    const impression = await getSupabaseAdmin()
      .from("ad_impressions")
      .insert({
        user_id: input.userId,
        ad_network: "mock",
        placement_id: "rewarded",
        estimated_revenue_usd: input.estimatedRevenueUsd,
        status: "estimated",
      })
      .select("id")
      .single();
    assertNoError(impression);
    const impressionId = impression.data?.id;
    if (!impressionId) throw new Error("Failed to create ad impression");

    const reward = await getSupabaseAdmin()
      .from("ad_reward_entries")
      .insert({
        user_id: input.userId,
        impression_id: impressionId,
        revenue_share_bps: DEFAULT_SHARE_BPS,
        estimated_reward_usd: input.estimatedRewardUsd,
        status: "pending",
      })
      .select("id")
      .single();
    assertNoError(reward);
    const rewardId = reward.data?.id;
    if (!rewardId) throw new Error("Failed to create ad reward entry");

    await insertLedgerEntry({
      userId: input.userId,
      kind: "credit",
      amountCredits: input.credits,
      amountUsd: input.estimatedRewardUsd,
      title: input.title,
      detail: input.detail,
      sourceType: "ad_reward_pending",
      sourceId: rewardId,
    });
  },
};

export const supabaseVaultLevelRepository: VaultLevelRepository = {
  async getStatus(userId) {
    const row = await getTierRow(userId);
    const currentTier = (row.current_tier ?? "starter") as VaultTierId;
    const current = getVaultTier(currentTier);
    const next = getNextVaultTier(currentTier);
    const activeDays = numberFrom(row.active_days);
    const lifetimeVerifiedAds = numberFrom(row.lifetime_verified_ads);
    const cleanActivityDays = numberFrom(row.clean_activity_days);
    const successfulRedemptions = numberFrom(row.successful_redemptions);
    const earningsTodayUsd = numberFrom(row.earnings_today_usd);
    const trustScore = numberFrom(row.trust_score, 50);

    return {
      userId,
      currentTier: toContractTier(current),
      nextTier: next ? toContractTier(next) : null,
      revenueShareBps: numberFrom(row.revenue_share_bps, current.revenueShareBps),
      progressToNext: tierProgress({
        tier: currentTier,
        activeDays,
        verifiedAds: lifetimeVerifiedAds,
        successfulRedemptions,
        cleanActivityDays,
      }),
      dailyEarningCapUsd: current.dailyEarningCapUsd,
      dailyRewardedAdLimit: current.dailyRewardedAdLimit,
      adsWatchedToday: numberFrom(row.ads_watched_today),
      earningsTodayUsd,
      capRemainingUsd: Math.max(current.dailyEarningCapUsd - earningsTodayUsd, 0),
      activeDays,
      lifetimeVerifiedAds,
      cleanActivityDays,
      successfulRedemptions,
      trustScore,
      trustState: trustScore >= 90 ? "vip" : trustScore >= 75 ? "trusted" : trustScore >= 45 ? "building" : "review",
      tierStartedAt: iso(row.tier_started_at),
      tierExpiresAt: typeof row.tier_expires_at === "string" ? row.tier_expires_at : null,
      requirements: requirementsFor({ currentTier, activeDays, lifetimeVerifiedAds, cleanActivityDays, successfulRedemptions }),
    } satisfies VaultLevelStatus;
  },
  async recordRewardedAd(input) {
    const row = await getTierRow(input.userId);
    const result = await getSupabaseAdmin()
      .from("user_tiers")
      .update({
        ads_watched_today: numberFrom(row.ads_watched_today) + 1,
        earnings_today_usd: numberFrom(row.earnings_today_usd) + input.estimatedRewardUsd,
        lifetime_verified_ads: numberFrom(row.lifetime_verified_ads) + (input.status === "confirmed" ? 1 : 0),
        revenue_share_bps: input.revenueShareBps,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", input.userId);
    assertNoError(result);
  },
};

function sameUtcDay(a: Date, b: Date): boolean {
  return a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth() && a.getUTCDate() === b.getUTCDate();
}

function mapStreak(userId: string, row: AnyRecord): StreakSummary {
  const lastClaimed = typeof row.last_claimed_at === "string" ? new Date(row.last_claimed_at) : null;
  const today = new Date();
  return {
    userId,
    currentDays: numberFrom(row.current_days),
    bonusPercent: numberFrom(row.bonus_percent),
    claimable: !lastClaimed || !sameUtcDay(lastClaimed, today),
    lastClaimedAt: lastClaimed ? lastClaimed.toISOString() : null,
  };
}

export const supabaseStreakRepository: StreakRepository = {
  async getSummary(userId) {
    await ensureAccountRows(userId);
    const result = await getSupabaseAdmin()
      .from("streak_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    assertNoError(result);
    return mapStreak(userId, result.data ?? {});
  },
  async claim(userId, credits) {
    const current = await supabaseStreakRepository.getSummary(userId);
    const claimDate = new Date().toISOString().slice(0, 10);

    const claim = await getSupabaseAdmin()
      .from("streak_claims")
      .insert({
        user_id: userId,
        claim_date: claimDate,
        awarded_credits: credits,
      });
    assertNoError(claim);

    const nextDays = current.currentDays + 1;
    const result = await getSupabaseAdmin()
      .from("streak_profiles")
      .update({
        current_days: nextDays,
        best_days: Math.max(nextDays, current.currentDays),
        bonus_percent: nextDays >= 7 ? 25 : 0,
        last_claimed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);
    assertNoError(result);

    await supabaseWalletRepository.applyCredit(userId, credits, "Daily streak bonus", `Day ${nextDays}`);
    return supabaseStreakRepository.getSummary(userId);
  },
};

export const supabaseCatalogRepository: CatalogRepository = {
  async listCatalog() {
    const result = await getSupabaseAdmin()
      .from("offers")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: false });
    assertNoError(result);

    return (result.data ?? []).map((item: AnyRecord): CatalogItem => {
      const metadata = typeof item.metadata === "object" && item.metadata ? item.metadata : {};
      const category = item.category === "in-app" || item.category === "external" ? item.category : "surveys";
      return {
        id: item.id,
        title: item.title,
        category,
        badge: metadata.availability,
        rewardLabel: `$${numberFrom(item.payout_usd).toFixed(2)}`,
        route: metadata.route ?? "/offerwall",
        active: item.active,
      };
    });
  },
};

export const supabaseRedemptionRepository: RedemptionRepository = {
  async create(input) {
    const result = await getSupabaseAdmin()
      .from("redemption_requests")
      .insert({
        user_id: input.userId,
        method_type: input.method,
        amount_usd: input.amountUsd,
        credits_debited: input.creditsDebited,
        destination_masked: input.destinationMasked,
        status: "created",
      })
      .select("*")
      .single();
    assertNoError(result);

    return {
      id: result.data.id,
      userId: input.userId,
      method: result.data.method_type,
      amountUsd: numberFrom(result.data.amount_usd),
      creditsDebited: numberFrom(result.data.credits_debited),
      destinationMasked: result.data.destination_masked,
      status: result.data.status,
      createdAt: iso(result.data.created_at),
    } satisfies Redemption;
  },
  async getByUser(userId) {
    const result = await getSupabaseAdmin()
      .from("redemption_requests")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    assertNoError(result);

    return (result.data ?? []).map((row: AnyRecord): Redemption => ({
      id: row.id,
      userId,
      method: row.method_type,
      amountUsd: numberFrom(row.amount_usd),
      creditsDebited: numberFrom(row.credits_debited),
      destinationMasked: row.destination_masked,
      status: row.status,
      createdAt: iso(row.created_at),
    }));
  },
};
