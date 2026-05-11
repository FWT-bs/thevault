import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiRequest } from "../apiClient";

export type ApiPaymentMethod = {
  id: string;
  methodType: string;
  destinationMasked: string;
  isDefault: boolean;
};

export function usePaymentMethods() {
  return useQuery({
    queryKey: ["payment-methods"],
    queryFn: async () => {
      const data = await apiRequest<{ items: ApiPaymentMethod[] }>("/payment-methods");
      return data.items;
    },
  });
}

export function useAddPaymentMethod() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: { methodType: string; destinationMasked: string }) => {
      const data = await apiRequest<{ paymentMethod: ApiPaymentMethod }>("/payment-methods", {
        method: "POST",
        body: JSON.stringify(input),
      });
      return data.paymentMethod;
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["payment-methods"] });
    },
  });
}
