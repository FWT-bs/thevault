import type { VercelRequest, VercelResponse } from "@vercel/node";

import { getRequestUserId } from "../../src/lib/auth";
import { fail, ok, withMethod } from "../../src/lib/http";
import { PaymentMethodsService } from "../../src/services/payment-methods.service";

const service = new PaymentMethodsService();

async function getHandler(req: VercelRequest, res: VercelResponse) {
  ok(res, { items: await service.list(await getRequestUserId(req)) });
}

async function postHandler(req: VercelRequest, res: VercelResponse) {
  const body = req.body as { methodType?: string; destinationMasked?: string };
  if (!body?.methodType || !body?.destinationMasked) {
    fail(res, 400, { code: "invalid_payload", message: "methodType and destinationMasked are required" });
    return;
  }
  ok(res, { paymentMethod: await service.add(await getRequestUserId(req), body.methodType, body.destinationMasked) }, 201);
}

async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === "GET") return getHandler(req, res);
    if (req.method === "POST") return postHandler(req, res);
    fail(res, 405, { code: "method_not_allowed", message: "Allowed: GET, POST" });
  } catch (error) {
    fail(res, 500, { code: "payment_methods_failed", message: (error as Error).message });
  }
}

export default withMethod(["GET", "POST"], handler);
