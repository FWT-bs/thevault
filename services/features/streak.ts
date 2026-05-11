import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { StreakSummary } from "@thevault/contracts";

import { apiRequest, createIdempotencyKey } from "../apiClient";

export function useStreakSummary() {
  return useQuery({
    queryKey: ["streak", "summary"],
    queryFn: async () => {
      const data = await apiRequest<{ streak: StreakSummary }>("/streak/summary");
      return data.streak;
    },
  });
}

export function useClaimStreak() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const idempotencyKey = createIdempotencyKey("streak-claim");
      return apiRequest<{ awardedCredits: number; streak: StreakSummary }>("/streak/claim", {
        method: "POST",
        idempotencyKey,
        body: JSON.stringify({ idempotencyKey }),
      });
    },
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["streak", "summary"] }),
        client.invalidateQueries({ queryKey: ["wallet", "balance"] }),
        client.invalidateQueries({ queryKey: ["wallet", "transactions"] }),
      ]);
    },
  });
}
