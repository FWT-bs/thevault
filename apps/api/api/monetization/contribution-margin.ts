import type { VercelRequest, VercelResponse } from "@vercel/node";

import { contributionMargin } from "../../src/config/monetization";
import { fail, ok, withMethod } from "../../src/lib/http";

async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const body = req.body as {
      adRevenueUsd?: number;
      offerRevenueUsd?: number;
      payoutCostUsd?: number;
      processorFeesUsd?: number;
      fraudLossUsd?: number;
    };
    if (
      typeof body?.adRevenueUsd !== "number" ||
      typeof body?.offerRevenueUsd !== "number" ||
      typeof body?.payoutCostUsd !== "number" ||
      typeof body?.processorFeesUsd !== "number" ||
      typeof body?.fraudLossUsd !== "number"
    ) {
      fail(res, 400, { code: "invalid_payload", message: "all revenue and cost fields are required" });
      return;
    }
    const payload = {
      adRevenueUsd: body.adRevenueUsd,
      offerRevenueUsd: body.offerRevenueUsd,
      payoutCostUsd: body.payoutCostUsd,
      processorFeesUsd: body.processorFeesUsd,
      fraudLossUsd: body.fraudLossUsd,
    };
    ok(res, { margin: contributionMargin(payload) });
  } catch (error) {
    fail(res, 500, { code: "contribution_margin_failed", message: (error as Error).message });
  }
}

export default withMethod(["POST"], handler);
