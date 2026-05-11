import { useMutation } from "@tanstack/react-query";
import type { AdDecision, RewardedAdGrant } from "@thevault/contracts";

import { apiRequest } from "../apiClient";

export function useAdDecision() {
  return useMutation({
    mutationFn: async (input: { placement: string; sessionDepth?: number }) =>
      apiRequest<{ decision: AdDecision }>("/monetization/ad-decision", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  });
}

export function useRewardedGrant() {
  return useMutation({
    mutationFn: async (input: { placement: string; adNetworkRef: string }) =>
      apiRequest<{ grant: RewardedAdGrant }>("/monetization/rewarded-grant", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  });
}

export function usePayoutGuardrails() {
  return useMutation({
    mutationFn: async (input: { amountUsd: number; riskLevel: "allow" | "review" | "block"; method?: string }) =>
      apiRequest<{
        guardrails: {
          minPayoutUsd: number;
          passesMin: boolean;
          reviewRequired: boolean;
          firstWithdrawalHold: string;
        };
      }>(
        "/monetization/payout-guardrails",
        {
          method: "POST",
          body: JSON.stringify(input),
        },
      ),
  });
}

export function useScheduleStreakReminder() {
  return useMutation({
    mutationFn: async () =>
      apiRequest<{ notification: { scheduled: boolean } }>("/notifications/streak-reminder", {
        method: "POST",
      }),
  });
}
