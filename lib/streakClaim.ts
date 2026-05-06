// Tiny in-memory store so the streak-claim popup can flag the daily streak
// as claimed before navigating back, and the home screen can re-render
// without re-mount. No persistence — the flag resets on app reload, which
// matches what a real "daily" claim would do server-side anyway.

let claimed = false;
const subscribers = new Set<() => void>();

export const streakClaim = {
  isClaimed(): boolean {
    return claimed;
  },
  setClaimed(value: boolean) {
    if (claimed === value) return;
    claimed = value;
    subscribers.forEach((fn) => fn());
  },
  subscribe(listener: () => void): () => void {
    subscribers.add(listener);
    return () => {
      subscribers.delete(listener);
    };
  },
};
