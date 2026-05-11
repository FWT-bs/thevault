import type { VercelRequest, VercelResponse } from "@vercel/node";

import { fail, ok, withMethod } from "../../src/lib/http";

const markers: { deviceId: string; reason: string; createdAt: string }[] = [];

async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === "GET") {
      ok(res, { items: markers });
      return;
    }
    const body = req.body as { deviceId?: string; reason?: string };
    if (!body?.deviceId || !body?.reason) {
      fail(res, 400, { code: "invalid_payload", message: "deviceId and reason are required" });
      return;
    }
    const item = { deviceId: body.deviceId, reason: body.reason, createdAt: new Date().toISOString() };
    markers.unshift(item);
    ok(res, { marker: item }, 201);
  } catch (error) {
    fail(res, 500, { code: "risk_device_markers_failed", message: (error as Error).message });
  }
}

export default withMethod(["GET", "POST"], handler);
