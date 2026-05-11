export const monetizationConfig = {
  defaultRewardedAdRevenueUsd: 0.022,
  starterShareBps: 3000,
  maxPermanentShareBps: 5000,
  temporaryBoostMaxShareBps: 6000,
  giftCardMinCashoutUsd: 10,
  cashMinCashoutUsd: 20,
  maxDailyRedemptionUsd: 250,
  offerCompletionHoldHours: 6,
  baseCrPerUsd: 100,
  payoutMarginFloor: 0.18,
  adVerificationHoldHours: 24,
};

export function contributionMargin(input: {
  adRevenueUsd: number;
  offerRevenueUsd: number;
  payoutCostUsd: number;
  processorFeesUsd: number;
  fraudLossUsd: number;
}) {
  const gross = input.adRevenueUsd + input.offerRevenueUsd;
  const costs = input.payoutCostUsd + input.processorFeesUsd + input.fraudLossUsd;
  return {
    grossRevenueUsd: gross,
    totalCostUsd: costs,
    contributionMarginUsd: gross - costs,
    contributionMarginPct: gross === 0 ? 0 : (gross - costs) / gross,
  };
}
