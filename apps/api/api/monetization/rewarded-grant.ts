import type { VercelRequest, VercelResponse } from "@vercel/node";

import { getRequestUserId } from "../../src/lib/auth";
import { fail, ok, withMethod } from "../../src/lib/http";
import { MonetizationService } from "../../src/services/monetization.service";

const service = new MonetizationService();

async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const body = req.body as { placement?: string; adNetworkRef?: string };
    if (!body?.placement || !body?.adNetworkRef) {
      fail(res, 400, { code: "invalid_payload", message: "placement and adNetworkRef are required" });
      return;
    }
    const grant = await service.rewardedGrant({
      userId: await getRequestUserId(req),
      placement: body.placement,
      adNetworkRef: body.adNetworkRef,
    });
    ok(res, { grant }, 201);
  } catch (error) {
    fail(res, 500, { code: "rewarded_grant_failed", message: (error as Error).message });
  }
}

export default withMethod(["POST"], handler);
