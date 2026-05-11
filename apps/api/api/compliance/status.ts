import type { VercelRequest, VercelResponse } from "@vercel/node";

import { getRequestUserId } from "../../src/lib/auth";
import { fail, ok, withMethod } from "../../src/lib/http";

async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    ok(res, {
      status: {
        userId: await getRequestUserId(req),
        kycStatus: "none",
        geoAllowed: true,
        sanctionsClear: true,
        checksAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    fail(res, 500, { code: "compliance_status_failed", message: (error as Error).message });
  }
}

export default withMethod(["GET"], handler);
