import { getAccountAccessToken } from "./features/account";
import { DEV_MEGA_API_USER_ID, isDevMegaActive } from "./auth/devMega";

const DEFAULT_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api";

export type ApiErrorShape = {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    requestId?: string;
  };
};

export type ApiSuccessShape<T> = {
  ok: true;
  data: T;
};

export async function apiRequest<T>(
  path: string,
  init?: RequestInit & { userId?: string; idempotencyKey?: string },
): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  const accessToken = await getAccountAccessToken();
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  } else {
    headers.set(
      "x-user-id",
      init?.userId ??
        (isDevMegaActive() ? DEV_MEGA_API_USER_ID : "00000000-0000-0000-0000-000000000001"),
    );
  }
  if (init?.idempotencyKey) headers.set("x-idempotency-key", init.idempotencyKey);

  if (isDevMegaActive() && path === "/wallet/balance") {
    const stub = mockApiResponse<T>(path, init);
    if (stub) return stub;
  }

  let res: Response;
  try {
    res = await fetch(`${DEFAULT_BASE_URL}${path}`, {
      ...init,
      headers,
    });
  } catch (error) {
    const fallback = mockApiResponse<T>(path, init);
    if (fallback) return fallback;
    throw error;
  }
  const json = (await res.json()) as ApiSuccessShape<T> | ApiErrorShape;

  if (!res.ok || !json.ok) {
    const error = (json as ApiErrorShape).error;
    throw new Error(error?.message ?? "API request failed");
  }

  return (json as ApiSuccessShape<T>).data;
}

export function createIdempotencyKey(scope: string): string {
  return `${scope}-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
}

function mockApiResponse<T>(path: string, init?: RequestInit): T | null {
  const now = new Date().toISOString();
  const method = init?.method?.toUpperCase() ?? "GET";

  if (path === "/wallet/balance") {
    const mega = isDevMegaActive();
    return {
      wallet: {
        userId: DEV_MEGA_API_USER_ID,
        credits: mega ? 999_999_999 : 0,
        usdBalance: mega ? 9_999_999 : 0,
        availableCredits: mega ? 999_999_999 : 0,
        availableUsd: mega ? 9_999_999 : 0,
        pendingCredits: 0,
        pendingUsd: 0,
        lockedCredits: 0,
        lockedUsd: 0,
        lifetimeGeneratedUsd: mega ? 9_999_999 : 0,
        lifetimeEarnedUsd: mega ? 9_999_999 : 0,
        currentTier: mega ? "diamond" : "starter",
        currentShareBps: mega ? 5000 : 3000,
        fxRateCrPerUsd: 100,
        updatedAt: now,
      },
    } as T;
  }

  if (path === "/auth/me") {
    return {
      user: {
        id: "00000000-0000-0000-0000-000000000001",
        displayName: "Player",
        email: null,
        phone: null,
        tier: "starter",
        kycStatus: "none",
      },
    } as T;
  }

  if (path === "/vault-level/status") {
    return {
      vaultLevel: {
        userId: "00000000-0000-0000-0000-000000000001",
        currentTier: {
          id: "starter",
          name: "Starter",
          shortName: "Starter",
          revenueShareBps: 3000,
          dailyEarningCapUsd: 0.5,
          dailyRewardedAdLimit: 20,
          firstRedemptionDelay: "Locked",
          laterRedemptionDelay: "Locked",
          temporary: false,
          requirements: ["Create your account"],
          benefits: ["30% verified ad revenue share", "Starter earning cap", "Basic streak rewards"],
        },
        nextTier: {
          id: "bronze",
          name: "Bronze Vault Member",
          shortName: "Bronze",
          revenueShareBps: 3500,
          dailyEarningCapUsd: 1,
          dailyRewardedAdLimit: 40,
          firstRedemptionDelay: "7 days",
          laterRedemptionDelay: "3-5 days",
          temporary: false,
          requirements: ["3 active earning days", "25 verified rewarded ads", "Email verified", "No fraud flags"],
          benefits: ["35% verified ad revenue share", "Offerwall unlock", "Higher daily cap"],
        },
        revenueShareBps: 3000,
        progressToNext: 0,
        dailyEarningCapUsd: 0.5,
        dailyRewardedAdLimit: 20,
        adsWatchedToday: 0,
        earningsTodayUsd: 0,
        capRemainingUsd: 0.5,
        activeDays: 0,
        lifetimeVerifiedAds: 0,
        cleanActivityDays: 0,
        successfulRedemptions: 0,
        trustScore: 50,
        trustState: "building",
        tierStartedAt: now,
        tierExpiresAt: null,
        requirements: [
          { id: "account", label: "Account created", complete: true, current: null, target: null },
          { id: "active-days", label: "3 active earning days", complete: false, current: 0, target: 3 },
          { id: "verified-ads", label: "25 verified rewarded ads", complete: false, current: 0, target: 25 },
          { id: "clean-activity", label: "3 clean activity days", complete: false, current: 0, target: 3 },
          { id: "redemption", label: "Reach Bronze", complete: false, current: 0, target: 0 },
        ],
      },
    } as T;
  }

  if (path === "/wallet/transactions") {
    return {
      items: [],
      nextCursor: null,
    } as T;
  }

  if (path === "/streak/summary") {
    return {
      streak: {
        userId: "00000000-0000-0000-0000-000000000001",
        currentDays: 0,
        bonusPercent: 0,
        claimable: true,
        lastClaimedAt: null,
      },
    } as T;
  }

  if (path === "/streak/claim" && method === "POST") {
    return {
      awardedCredits: 25,
      streak: {
        userId: "00000000-0000-0000-0000-000000000001",
        currentDays: 7,
        bonusPercent: 25,
        claimable: false,
        lastClaimedAt: now,
      },
    } as T;
  }

  if (path === "/catalog") {
    return {
      items: [
        { id: "blackjack", title: "Blackjack", category: "in-app", rewardLabel: "8 CR/min", route: "/blackjack", active: true, badge: "Hot" },
        { id: "block-blast", title: "Block Blast", category: "in-app", rewardLabel: "12 CR/min", route: "/block-blast", active: true, badge: "New" },
        { id: "bricks-vs-balls", title: "Bricks vs Balls", category: "in-app", rewardLabel: "10 CR/min", route: "/bricks-vs-balls", active: true, badge: "Live" },
        { id: "brand-pulse", title: "Brand Pulse Survey", category: "surveys", rewardLabel: "$2.20", route: "/offerwall", active: true, badge: "Hot" },
      ],
    } as T;
  }

  if (path === "/monetization/rewarded-grant" && method === "POST") {
    return {
      grant: {
        id: `grant-${Date.now()}`,
        userId: "00000000-0000-0000-0000-000000000001",
        placement: "mock",
        adNetworkRef: `mock-${Date.now()}`,
        impressionId: `impression-${Date.now()}`,
        rewardEntryId: `reward-${Date.now()}`,
        tier: "starter",
        revenueShareBps: 3000,
        estimatedAdRevenueUsd: 0.022,
        estimatedRewardUsd: 0.0066,
        estimatedRewardCredits: 1,
        status: "pending",
        grantedAt: now,
      },
    } as T;
  }

  if (path === "/monetization/payout-guardrails" && method === "POST") {
    return {
      guardrails: {
        minPayoutUsd: 10,
        passesMin: true,
        reviewRequired: false,
        firstWithdrawalHold: "1-3 days",
      },
    } as T;
  }

  if (path === "/risk/evaluate" && method === "POST") {
    return {
      risk: {
        level: "allow",
        reviewedAt: now,
        velocityCount: 1,
        suspiciousDevice: false,
      },
    } as T;
  }

  if (path === "/payment-methods" && method === "POST") {
    return {
      paymentMethod: {
        id: `method-${Date.now()}`,
        methodType: "card",
        destinationMasked: "New method",
        isDefault: false,
      },
    } as T;
  }

  if (path === "/payment-methods") {
    return {
      items: [],
    } as T;
  }

  if (path === "/redemption/create" && method === "POST") {
    return {
      redemption: {
        id: `redemption-${Date.now()}`,
        userId: "00000000-0000-0000-0000-000000000001",
        method: "gift_card",
        amountUsd: 10,
        creditsDebited: 1000,
        destinationMasked: "Amazon gift card",
        status: "created",
        createdAt: now,
      },
    } as T;
  }

  if (path === "/gameplay/start" && method === "POST") {
    return { session: { id: `session-${Date.now()}`, gameId: "mock", modeId: "classic", state: "started", startedAt: now } } as T;
  }

  if (path === "/gameplay/complete" && method === "POST") {
    return { result: { id: `result-${Date.now()}`, score: 420, won: true, rewardsCredits: 12, createdAt: now } } as T;
  }

  if (path === "/offers/attribution" && method === "POST") {
    return { attribution: { accepted: true, receivedAt: now } } as T;
  }

  return null;
}
