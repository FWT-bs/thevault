import type { VercelRequest, VercelResponse } from "@vercel/node";

import { getRequestUserId } from "../../src/lib/auth";
import { fail, ok, withMethod } from "../../src/lib/http";
import { AuditService } from "../../src/services/audit.service";

const service = new AuditService();

async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const body = req.body as { action?: string; entityType?: string; entityId?: string; metadata?: Record<string, unknown> };
    if (!body?.action || !body?.entityType || !body?.entityId) {
      fail(res, 400, { code: "invalid_payload", message: "action, entityType, entityId are required" });
      return;
    }
    const log = await service.append({
      actorUserId: await getRequestUserId(req),
      action: body.action,
      entityType: body.entityType,
      entityId: body.entityId,
      metadata: body.metadata,
    });
    ok(res, { log }, 201);
  } catch (error) {
    fail(res, 500, { code: "audit_append_failed", message: (error as Error).message });
  }
}

export default withMethod(["POST"], handler);
