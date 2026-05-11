import type { CatalogItem } from "@thevault/contracts/schemas/catalog";
import type { RewardedAdGrant, VaultLevelStatus, Redemption, StreakSummary, WalletBalance, WalletTransaction } from "@thevault/contracts";

export interface WalletRepository {
  getBalance(userId: string): Promise<WalletBalance>;
  listTransactions(userId: string): Promise<WalletTransaction[]>;
  applyCredit(userId: string, credits: number, title: string, detail: string): Promise<void>;
  applyDebit(userId: string, credits: number, title: string, detail: string): Promise<void>;
  applyPendingAdReward(input: {
    userId: string;
    credits: number;
    estimatedRewardUsd: number;
    estimatedRevenueUsd: number;
    title: string;
    detail: string;
  }): Promise<void>;
}

export interface VaultLevelRepository {
  getStatus(userId: string): Promise<VaultLevelStatus>;
  recordRewardedAd(input: RewardedAdGrant): Promise<void>;
}

export interface StreakRepository {
  getSummary(userId: string): Promise<StreakSummary>;
  claim(userId: string, credits: number): Promise<StreakSummary>;
}

export interface CatalogRepository {
  listCatalog(): Promise<CatalogItem[]>;
}

export interface RedemptionRepository {
  create(input: Omit<Redemption, "id" | "createdAt" | "status">): Promise<Redemption>;
  getByUser(userId: string): Promise<Redemption[]>;
}
