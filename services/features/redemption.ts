import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Redemption } from "@thevault/contracts";

import { apiRequest, createIdempotencyKey } from "../apiClient";

export function useRedemptions() {
  return useQuery({
    queryKey: ["redemption", "list"],
    queryFn: async () => {
      const data = await apiRequest<{ items: Redemption[] }>("/redemption/list");
      return data.items;
    },
  });
}

export function useCreateRedemption() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: { method: "gift_card" | "paypal" | "crypto"; amountUsd: number; destination: string }) => {
      const idempotencyKey = createIdempotencyKey("redemption-create");
      const data = await apiRequest<{ redemption: Redemption }>("/redemption/create", {
        method: "POST",
        idempotencyKey,
        body: JSON.stringify({ ...input, idempotencyKey }),
      });
      return data.redemption;
    },
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["redemption", "list"] }),
        client.invalidateQueries({ queryKey: ["wallet", "balance"] }),
        client.invalidateQueries({ queryKey: ["wallet", "transactions"] }),
      ]);
    },
  });
}
