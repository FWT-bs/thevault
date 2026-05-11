import { useQuery } from "@tanstack/react-query";
import type { VaultLevelStatus } from "@thevault/contracts";

import { apiRequest } from "../apiClient";

export function useVaultLevel() {
  return useQuery({
    queryKey: ["vault-level", "status"],
    queryFn: async () => {
      const data = await apiRequest<{ vaultLevel: VaultLevelStatus }>("/vault-level/status");
      return data.vaultLevel;
    },
  });
}
