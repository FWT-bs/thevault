import { StreakSummarySchema } from "@thevault/contracts";
import type { VercelRequest, VercelResponse } from "@vercel/node";

import { getRequestUserId } from "../../src/lib/auth";
import { fail, ok, withMethod } from "../../src/lib/http";
import { StreakService } from "../../src/services/streak.service";

const service = new StreakService();

async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    ok(res, { streak: StreakSummarySchema.parse(await service.summary(await getRequestUserId(req))) });
  } catch (error) {
    fail(res, 500, { code: "streak_summary_failed", message: (error as Error).message });
  }
}

export default withMethod(["GET"], handler);
