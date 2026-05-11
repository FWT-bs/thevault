import { isMockUserId, isSupabaseConfigured } from "../lib/supabase";
import {
  catalogRepository as memoryCatalogRepository,
  redemptionRepository as memoryRedemptionRepository,
  streakRepository as memoryStreakRepository,
  vaultLevelRepository as memoryVaultLevelRepository,
  walletRepository as memoryWalletRepository,
} from "./memory";
import {
  supabaseCatalogRepository,
  supabaseRedemptionRepository,
  supabaseStreakRepository,
  supabaseVaultLevelRepository,
  supabaseWalletRepository,
} from "./supabase";
import type { CatalogRepository, RedemptionRepository, StreakRepository, VaultLevelRepository, WalletRepository } from "./interfaces";

function shouldUseSupabase(userId?: string): boolean {
  return isSupabaseConfigured() && (!userId || !isMockUserId(userId));
}

export const walletRepository: WalletRepository = {
  getBalance(userId) {
    return shouldUseSupabase(userId)
      ? supabaseWalletRepository.getBalance(userId)
      : memoryWalletRepository.getBalance(userId);
  },
  listTransactions(userId) {
    return shouldUseSupabase(userId)
      ? supabaseWalletRepository.listTransactions(userId)
      : memoryWalletRepository.listTransactions(userId);
  },
  applyCredit(userId, credits, title, detail) {
    return shouldUseSupabase(userId)
      ? supabaseWalletRepository.applyCredit(userId, credits, title, detail)
      : memoryWalletRepository.applyCredit(userId, credits, title, detail);
  },
  applyDebit(userId, credits, title, detail) {
    return shouldUseSupabase(userId)
      ? supabaseWalletRepository.applyDebit(userId, credits, title, detail)
      : memoryWalletRepository.applyDebit(userId, credits, title, detail);
  },
  applyPendingAdReward(input) {
    return shouldUseSupabase(input.userId)
      ? supabaseWalletRepository.applyPendingAdReward(input)
      : memoryWalletRepository.applyPendingAdReward(input);
  },
};

export const vaultLevelRepository: VaultLevelRepository = {
  getStatus(userId) {
    return shouldUseSupabase(userId)
      ? supabaseVaultLevelRepository.getStatus(userId)
      : memoryVaultLevelRepository.getStatus(userId);
  },
  recordRewardedAd(input) {
    return shouldUseSupabase(input.userId)
      ? supabaseVaultLevelRepository.recordRewardedAd(input)
      : memoryVaultLevelRepository.recordRewardedAd(input);
  },
};

export const streakRepository: StreakRepository = {
  getSummary(userId) {
    return shouldUseSupabase(userId)
      ? supabaseStreakRepository.getSummary(userId)
      : memoryStreakRepository.getSummary(userId);
  },
  claim(userId, credits) {
    return shouldUseSupabase(userId)
      ? supabaseStreakRepository.claim(userId, credits)
      : memoryStreakRepository.claim(userId, credits);
  },
};

export const catalogRepository: CatalogRepository = {
  listCatalog() {
    return shouldUseSupabase()
      ? supabaseCatalogRepository.listCatalog()
      : memoryCatalogRepository.listCatalog();
  },
};

export const redemptionRepository: RedemptionRepository = {
  create(input) {
    return shouldUseSupabase(input.userId)
      ? supabaseRedemptionRepository.create(input)
      : memoryRedemptionRepository.create(input);
  },
  getByUser(userId) {
    return shouldUseSupabase(userId)
      ? supabaseRedemptionRepository.getByUser(userId)
      : memoryRedemptionRepository.getByUser(userId);
  },
};
