import { WalletBalanceResponseSchema } from "@thevault/contracts";
import type { VercelRequest, VercelResponse } from "@vercel/node";

import { getRequestUserId } from "../../src/lib/auth";
import { fail, ok, withMethod } from "../../src/lib/http";
import { WalletService } from "../../src/services/wallet.service";

const service = new WalletService();

async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    ok(res, WalletBalanceResponseSchema.shape.data.parse({ wallet: await service.getBalance(await getRequestUserId(req)) }));
  } catch (error) {
    fail(res, 500, { code: "wallet_balance_failed", message: (error as Error).message });
  }
}

export default withMethod(["GET"], handler);
