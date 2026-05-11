import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { WalletBalance, WalletTransaction } from "@thevault/contracts";

import { apiRequest } from "../apiClient";

export function useWalletBalance() {
  return useQuery({
    queryKey: ["wallet", "balance"],
    queryFn: async () => {
      const data = await apiRequest<{ wallet: WalletBalance }>("/wallet/balance");
      return data.wallet;
    },
  });
}

export function useWalletTransactions() {
  return useQuery({
    queryKey: ["wallet", "transactions"],
    queryFn: async () => {
      const data = await apiRequest<{ items: WalletTransaction[]; nextCursor: string | null }>(
        "/wallet/transactions",
      );
      return data.items;
    },
  });
}

export function useRefreshWallet() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async () => true,
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["wallet", "balance"] }),
        client.invalidateQueries({ queryKey: ["wallet", "transactions"] }),
        client.invalidateQueries({ queryKey: ["vault-level", "status"] }),
      ]);
    },
  });
}
