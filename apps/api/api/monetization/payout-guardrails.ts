import type { VercelRequest, VercelResponse } from "@vercel/node";

import { fail, ok, withMethod } from "../../src/lib/http";
import { MonetizationService } from "../../src/services/monetization.service";

const service = new MonetizationService();

async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const body = req.body as { amountUsd?: number; riskLevel?: "allow" | "review" | "block"; method?: string };
    if (typeof body?.amountUsd !== "number" || !body?.riskLevel) {
      fail(res, 400, { code: "invalid_payload", message: "amountUsd and riskLevel are required" });
      return;
    }
    ok(res, {
      guardrails: await service.payoutGuardrails({
        amountUsd: body.amountUsd,
        riskLevel: body.riskLevel,
        method: body.method,
      }),
    });
  } catch (error) {
    fail(res, 500, { code: "payout_guardrails_failed", message: (error as Error).message });
  }
}

export default withMethod(["POST"], handler);
