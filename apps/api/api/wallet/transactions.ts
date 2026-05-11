import { WalletTransactionsResponseSchema } from "@thevault/contracts";
import type { VercelRequest, VercelResponse } from "@vercel/node";

import { getRequestUserId } from "../../src/lib/auth";
import { fail, ok, withMethod } from "../../src/lib/http";
import { WalletService } from "../../src/services/wallet.service";

const service = new WalletService();

async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    ok(
      res,
      WalletTransactionsResponseSchema.shape.data.parse({
        items: await service.listTransactions(await getRequestUserId(req)),
        nextCursor: null,
      }),
    );
  } catch (error) {
    fail(res, 500, { code: "wallet_transactions_failed", message: (error as Error).message });
  }
}

export default withMethod(["GET"], handler);
