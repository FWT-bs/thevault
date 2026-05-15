import { useMutation } from "@tanstack/react-query";

import { apiRequest } from "../apiClient";

export function useStartGameSession() {
  return useMutation({
    mutationFn: async (input: { gameId: string; modeId: string }) =>
      apiRequest<{ session: { id: string; startedAt: string } }>("/gameplay/start", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  });
}

export function useCompleteGameSession() {
  return useMutation({
    mutationFn: async (input: { sessionId: string; score: number }) =>
      apiRequest<{ result: { id: string; rewardsCredits: number } }>("/gameplay/complete", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  });
}
