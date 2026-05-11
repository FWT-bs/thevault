import { CreateRedemptionRequestSchema, CreateRedemptionResponseSchema } from "@thevault/contracts";
import type { VercelRequest, VercelResponse } from "@vercel/node";

import { getRequestUserId } from "../../src/lib/auth";
import { idempotencyGet, idempotencySet, readIdempotencyKey } from "../../src/lib/idempotency";
import { fail, ok, withMethod } from "../../src/lib/http";
import { AuditService } from "../../src/services/audit.service";
import { RedemptionService } from "../../src/services/redemption.service";

const service = new RedemptionService();
const audit = new AuditService();

async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const userId = await getRequestUserId(req);
    const body = CreateRedemptionRequestSchema.parse({
      ...req.body,
      idempotencyKey: readIdempotencyKey(req) ?? req.body?.idempotencyKey,
    });
    const cached = idempotencyGet("redemption_create", userId, body.idempotencyKey);
    if (cached) {
      ok(res, cached);
      return;
    }
    const redemption = await service.create(userId, body.method, body.amountUsd, body.destination);
    await audit.append({
      actorUserId: userId,
      action: "redemption.create",
      entityType: "redemption_request",
      entityId: redemption.id,
      metadata: { method: body.method, amountUsd: body.amountUsd },
    });
    const payload = CreateRedemptionResponseSchema.shape.data.parse({ redemption });
    idempotencySet("redemption_create", userId, body.idempotencyKey, payload);
    ok(res, payload, 201);
  } catch (error) {
    fail(res, 400, { code: "redemption_create_failed", message: (error as Error).message });
  }
}

export default withMethod(["POST"], handler);
