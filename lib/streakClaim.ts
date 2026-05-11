import { apiRequest, createIdempotencyKey } from "../services/apiClient";

let claimed: boolean | null = null;
const subscribers = new Set<() => void>();

function notify() {
  subscribers.forEach((fn) => fn());
}

export const streakClaim = {
  isClaimed(): boolean {
    return claimed ?? false;
  },
  setClaimed(value: boolean) {
    if (claimed === value && claimed !== null) return;
    claimed = value;
    notify();
  },
  async syncFromApi() {
    const data = await apiRequest<{ streak: { claimable: boolean } }>("/streak/summary");
    claimed = !data.streak.claimable;
    notify();
    return claimed;
  },
  async claimViaApi() {
    const idempotencyKey = createIdempotencyKey("streak-claim-lib");
    await apiRequest<{ awardedCredits: number }>("/streak/claim", {
      method: "POST",
      idempotencyKey,
      body: JSON.stringify({ idempotencyKey }),
    });
    claimed = true;
    notify();
  },
  subscribe(listener: () => void): () => void {
    subscribers.add(listener);
    return () => {
      subscribers.delete(listener);
    };
  },
};
