import { useQuery } from "@tanstack/react-query";
import type { UserProfile } from "@thevault/contracts";

import { apiRequest } from "../apiClient";

export function useMe() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const data = await apiRequest<{ user: UserProfile }>("/auth/me");
      return data.user;
    },
  });
}
