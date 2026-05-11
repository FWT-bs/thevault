export type RiskLevel = "allow" | "review" | "block";

export type RiskInput = {
  userId: string;
  action: "streak_claim" | "redemption_create" | "offer_completion" | "game_session_complete";
  amountCredits?: number;
  deviceId?: string;
};

export function evaluateRisk(input: RiskInput): RiskLevel {
  if ((input.amountCredits ?? 0) > 50_000) return "review";
  return "allow";
}
