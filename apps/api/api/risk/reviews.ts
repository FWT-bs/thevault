import type { VercelRequest, VercelResponse } from "@vercel/node";

import { getRequestUserId } from "../../src/lib/auth";
import { fail, ok, withMethod } from "../../src/lib/http";
import { RiskService } from "../../src/services/risk.service";

const service = new RiskService();

async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const scope = req.query.scope;
    const userScoped = scope !== "all";
    ok(res, { items: await service.reviews(userScoped ? await getRequestUserId(req) : undefined) });
  } catch (error) {
    fail(res, 500, { code: "risk_reviews_failed", message: (error as Error).message });
  }
}

export default withMethod(["GET"], handler);
