import type { VercelRequest, VercelResponse } from "@vercel/node";

import { getRequestUserId } from "../../src/lib/auth";
import { fail, ok, withMethod } from "../../src/lib/http";
import { GameplayService } from "../../src/services/gameplay.service";
import { WalletService } from "../../src/services/wallet.service";
import { walletRepository } from "../../src/repositories";

const gameplay = new GameplayService();
const wallet = new WalletService();

async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const body = req.body as { sessionId?: string; score?: number };
    if (!body?.sessionId || typeof body.score !== "number") {
      fail(res, 400, { code: "invalid_payload", message: "sessionId and score are required" });
      return;
    }
    const userId = await getRequestUserId(req);
    const result = await gameplay.completeSession(userId, body.sessionId, body.score);
    if (result.rewardsCredits > 0) {
      await walletRepository.applyCredit(userId, result.rewardsCredits, "Game reward", `Session ${body.sessionId}`);
    }
    ok(res, { result, wallet: await wallet.getBalance(userId) });
  } catch (error) {
    fail(res, 500, { code: "gameplay_complete_failed", message: (error as Error).message });
  }
}

export default withMethod(["POST"], handler);
