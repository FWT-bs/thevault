import { useMutation } from "@tanstack/react-query";

import { apiRequest } from "../apiClient";

export function useOfferCompletionIngest() {
  return useMutation({
    mutationFn: async (input: { offerId: string; providerRef: string }) =>
      apiRequest<{ completion: { id: string; status: string } }>("/offers/completion", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  });
}

export function useOfferAttributionIngest() {
  return useMutation({
    mutationFn: async (input: { provider: string; clickId: string; offerId: string }) =>
      apiRequest<{ attribution: { id: string } }>("/offers/attribution", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  });
}
