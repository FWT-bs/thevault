import type { VercelRequest, VercelResponse } from "@vercel/node";

import { fail, ok, withMethod } from "../../src/lib/http";
import { AdminService } from "../../src/services/admin.service";

const service = new AdminService();

async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    ok(res, { summary: await service.summary() });
  } catch (error) {
    fail(res, 500, { code: "admin_summary_failed", message: (error as Error).message });
  }
}

export default withMethod(["GET"], handler);
