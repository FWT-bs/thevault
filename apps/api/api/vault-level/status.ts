import { VaultLevelStatusResponseSchema } from "@thevault/contracts";
import type { VercelRequest, VercelResponse } from "@vercel/node";

import { getRequestUserId } from "../../src/lib/auth";
import { fail, ok, withMethod } from "../../src/lib/http";
import { VaultLevelService } from "../../src/services/vault-level.service";

const service = new VaultLevelService();

async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    ok(
      res,
      VaultLevelStatusResponseSchema.shape.data.parse({
        vaultLevel: await service.getStatus(await getRequestUserId(req)),
      }),
    );
  } catch (error) {
    fail(res, 500, { code: "vault_level_status_failed", message: (error as Error).message });
  }
}

export default withMethod(["GET"], handler);
