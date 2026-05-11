import type { VercelRequest, VercelResponse } from "@vercel/node";

import { getRequestUserId } from "../../src/lib/auth";
import { fail, ok, withMethod } from "../../src/lib/http";
import { MonetizationService } from "../../src/services/monetization.service";

const service = new MonetizationService();

async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const body = req.body as { placement?: string; sessionDepth?: number };
    if (!body?.placement) {
      fail(res, 400, { code: "invalid_payload", message: "placement is required" });
      return;
    }
    const decision = await service.adDecision({
      placement: body.placement,
      sessionDepth: body.sessionDepth,
      userId: await getRequestUserId(req),
    });
    ok(res, { decision });
  } catch (error) {
    fail(res, 500, { code: "ad_decision_failed", message: (error as Error).message });
  }
}

export default withMethod(["POST"], handler);
