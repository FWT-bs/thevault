import type { VercelRequest, VercelResponse } from "@vercel/node";

import { fail, ok, withMethod } from "../../src/lib/http";

async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const body = req.body as { provider?: string; clickId?: string; offerId?: string };
    if (!body?.provider || !body?.clickId || !body?.offerId) {
      fail(res, 400, { code: "invalid_payload", message: "provider, clickId, and offerId are required" });
      return;
    }
    ok(
      res,
      {
        attribution: {
          id: crypto.randomUUID(),
          provider: body.provider,
          clickId: body.clickId,
          offerId: body.offerId,
          recordedAt: new Date().toISOString(),
        },
      },
      201,
    );
  } catch (error) {
    fail(res, 500, { code: "offers_attribution_failed", message: (error as Error).message });
  }
}

export default withMethod(["POST"], handler);
