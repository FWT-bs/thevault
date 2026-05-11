import { MeResponseSchema } from "@thevault/contracts";
import type { VercelRequest, VercelResponse } from "@vercel/node";

import { getRequestUserId } from "../../src/lib/auth";
import { fail, ok, withMethod } from "../../src/lib/http";
import { AuthService } from "../../src/services/auth.service";

const service = new AuthService();

async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const payload = { user: await service.me(await getRequestUserId(req)) };
    ok(res, MeResponseSchema.shape.data.parse(payload));
  } catch (error) {
    fail(res, 500, { code: "auth_me_failed", message: (error as Error).message });
  }
}

export default withMethod(["GET"], handler);
