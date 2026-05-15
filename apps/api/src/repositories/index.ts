// Supabase has been removed; every repository call now resolves to the
// in-memory implementation. Re-exporting under the original names keeps
// callers in services/* unchanged.
export {
  catalogRepository,
  redemptionRepository,
  streakRepository,
  vaultLevelRepository,
  walletRepository,
} from "./memory";
