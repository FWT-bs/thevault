import type { VercelRequest, VercelResponse } from "@vercel/node";

import { getRequestUserId } from "../../src/lib/auth";
import { fail, ok, withMethod } from "../../src/lib/http";
import { RiskService } from "../../src/services/risk.service";

const service = new RiskService();

async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const body = req.body as { action?: string; amountCredits?: number; deviceId?: string };
    if (!body?.action) {
      fail(res, 400, { code: "invalid_payload", message: "action is required" });
      return;
    }
    const risk = await service.evaluate({
      userId: await getRequestUserId(req),
      action: body.action as "streak_claim" | "redemption_create" | "offer_completion" | "game_session_complete",
      amountCredits: body.amountCredits,
      deviceId: body.deviceId,
    });
    ok(res, { risk });
  } catch (error) {
    fail(res, 500, { code: "risk_evaluate_failed", message: (error as Error).message });
  }
}

export default withMethod(["POST"], handler);
