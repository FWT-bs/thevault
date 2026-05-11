import type { VercelRequest, VercelResponse } from "@vercel/node";

import { getRequestUserId } from "../../src/lib/auth";
import { fail, ok, withMethod } from "../../src/lib/http";
import { OffersService } from "../../src/services/offers.service";

const service = new OffersService();

async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const body = req.body as { offerId?: string; providerRef?: string };
    if (!body?.offerId || !body?.providerRef) {
      fail(res, 400, { code: "invalid_payload", message: "offerId and providerRef are required" });
      return;
    }
    ok(res, { completion: await service.ingestCompletion(await getRequestUserId(req), body.offerId, body.providerRef) }, 201);
  } catch (error) {
    fail(res, 500, { code: "offers_completion_failed", message: (error as Error).message });
  }
}

export default withMethod(["POST"], handler);
