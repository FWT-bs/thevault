import { ClaimStreakRequestSchema, ClaimStreakResponseSchema } from "@thevault/contracts";
import type { VercelRequest, VercelResponse } from "@vercel/node";

import { getRequestUserId } from "../../src/lib/auth";
import { idempotencyGet, idempotencySet, readIdempotencyKey } from "../../src/lib/idempotency";
import { fail, ok, withMethod } from "../../src/lib/http";
import { AuditService } from "../../src/services/audit.service";
import { StreakService } from "../../src/services/streak.service";

const service = new StreakService();
const audit = new AuditService();

async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const userId = await getRequestUserId(req);
    const parsed = ClaimStreakRequestSchema.parse({
      idempotencyKey: readIdempotencyKey(req) ?? req.body?.idempotencyKey,
    });
    const cached = idempotencyGet("streak_claim", userId, parsed.idempotencyKey);
    if (cached) {
      ok(res, cached);
      return;
    }
    const streak = await service.claim(userId);
    const payload = ClaimStreakResponseSchema.shape.data.parse({ awardedCredits: 25, streak });
    await audit.append({
      actorUserId: userId,
      action: "streak.claim",
      entityType: "streak_claim",
      entityId: streak.userId,
      metadata: { awardedCredits: payload.awardedCredits },
    });
    idempotencySet("streak_claim", userId, parsed.idempotencyKey, payload);
    ok(res, payload);
  } catch (error) {
    fail(res, 400, { code: "streak_claim_failed", message: (error as Error).message });
  }
}

export default withMethod(["POST"], handler);
