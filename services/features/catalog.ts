import { useQuery } from "@tanstack/react-query";
import type { CatalogItem } from "@thevault/contracts";

import { apiRequest } from "../apiClient";

export function useCatalog() {
  return useQuery({
    queryKey: ["catalog", "list"],
    queryFn: async () => {
      const data = await apiRequest<{ items: CatalogItem[] }>("/catalog");
      return data.items;
    },
  });
}
