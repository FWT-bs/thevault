import type { VercelRequest, VercelResponse } from "@vercel/node";

import {
  DEFAULT_UNITY_GAME_BOUNDS,
  UnityGameIdSchema,
  type UnityGameId,
} from "@thevault/contracts";

import { getRequestUserId } from "../../src/lib/auth";
import { fail, ok, withMethod } from "../../src/lib/http";
import { GameplayService } from "../../src/services/gameplay.service";
import { WalletService } from "../../src/services/wallet.service";
import { walletRepository } from "../../src/repositories";

const gameplay = new GameplayService();
const wallet = new WalletService();

async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const body = req.body as {
      sessionId?: string;
      score?: number;
      gameId?: string;     // optional; Unity host sends it for bounds checks
      durationMs?: number; // optional; Unity host sends it for bounds checks
    };
    if (!body?.sessionId || typeof body.score !== "number") {
      fail(res, 400, { code: "invalid_payload", message: "sessionId and score are required" });
      return;
    }

    // If the caller identifies as a known Unity game, enforce the sanity
    // bounds before paying out. Bypassing this requires the client to omit
    // gameId, which the legacy RN flow does. Once all paths migrate to
    // Unity these checks can become mandatory.
    let score = Math.max(0, Math.floor(body.score));
    const maybeUnityId = UnityGameIdSchema.safeParse(body.gameId);
    if (maybeUnityId.success) {
      const bounds = DEFAULT_UNITY_GAME_BOUNDS[maybeUnityId.data as UnityGameId];
      if (bounds) {
        if (typeof body.durationMs === "number") {
          if (body.durationMs < bounds.minDurationMs) {
            fail(res, 400, {
              code: "implausible_duration",
              message: `Round too short for ${bounds.gameId}`,
            });
            return;
          }
          if (body.durationMs > bounds.maxDurationMs) {
            fail(res, 400, {
              code: "implausible_duration",
              message: `Round too long for ${bounds.gameId}`,
            });
            return;
          }
        }
        // Clamp instead of rejecting — a tampered score still yields a
        // reward, but only up to the per-game ceiling.
        if (score > bounds.maxScore) score = bounds.maxScore;
      }
    }

    const userId = await getRequestUserId(req);
    const result = await gameplay.completeSession(userId, body.sessionId, score);
    if (result.rewardsCredits > 0) {
      await walletRepository.applyCredit(userId, result.rewardsCredits, "Game reward", `Session ${body.sessionId}`);
    }
    ok(res, { result, wallet: await wallet.getBalance(userId) });
  } catch (error) {
    fail(res, 500, { code: "gameplay_complete_failed", message: (error as Error).message });
  }
}

export default withMethod(["POST"], handler);
