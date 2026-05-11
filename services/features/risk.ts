import { useMutation } from "@tanstack/react-query";

import { apiRequest } from "../apiClient";

export function useRiskEvaluate() {
  return useMutation({
    mutationFn: async (input: {
      action: "streak_claim" | "redemption_create" | "offer_completion" | "game_session_complete";
      amountCredits?: number;
      deviceId?: string;
    }) =>
      apiRequest<{ risk: { level: "allow" | "review" | "block"; reviewedAt: string } }>("/risk/evaluate", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  });
}
