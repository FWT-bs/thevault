export const CR_PER_USD = 100;

export function creditsToUsd(credits: number): number {
  return credits / CR_PER_USD;
}

export function usdToCredits(usd: number): number {
  return Math.round(usd * CR_PER_USD);
}
