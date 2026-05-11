import type { VercelRequest, VercelResponse } from "@vercel/node";

import { getRequestUserId } from "../../src/lib/auth";
import { fail, ok, withMethod } from "../../src/lib/http";
import { LedgerService } from "../../src/services/ledger.service";

const service = new LedgerService();

async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    ok(res, { items: await service.timeline(await getRequestUserId(req)) });
  } catch (error) {
    fail(res, 500, { code: "ledger_timeline_failed", message: (error as Error).message });
  }
}

export default withMethod(["GET"], handler);
