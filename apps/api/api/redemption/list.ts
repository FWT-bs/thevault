import type { VercelRequest, VercelResponse } from "@vercel/node";

import { getRequestUserId } from "../../src/lib/auth";
import { fail, ok, withMethod } from "../../src/lib/http";
import { RedemptionService } from "../../src/services/redemption.service";

const service = new RedemptionService();

async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    ok(res, { items: await service.list(await getRequestUserId(req)) });
  } catch (error) {
    fail(res, 500, { code: "redemption_list_failed", message: (error as Error).message });
  }
}

export default withMethod(["GET"], handler);
