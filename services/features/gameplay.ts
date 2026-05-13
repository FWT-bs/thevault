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
    mutationFn: async (input: {
      sessionId: string;
      score: number;
      // Optional fields used by the Unity host so the backend can enforce
      // per-game sanity bounds (see DEFAULT_UNITY_GAME_BOUNDS in
      // @thevault/contracts). Existing RN games omit these and the server
      // skips bounds validation.
      gameId?: string;
      durationMs?: number;
    }) =>
      apiRequest<{ result: { id: string; rewardsCredits: number } }>("/gameplay/complete", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  });
}
