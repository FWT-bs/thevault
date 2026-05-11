import type { VercelRequest, VercelResponse } from "@vercel/node";

import { getRequestUserId } from "../../src/lib/auth";
import { fail, ok, withMethod } from "../../src/lib/http";
import { GameplayService } from "../../src/services/gameplay.service";

const service = new GameplayService();

async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const body = req.body as { gameId?: string; modeId?: string };
    if (!body?.gameId || !body?.modeId) {
      fail(res, 400, { code: "invalid_payload", message: "gameId and modeId are required" });
      return;
    }
    ok(res, { session: await service.startSession(await getRequestUserId(req), body.gameId, body.modeId) }, 201);
  } catch (error) {
    fail(res, 500, { code: "gameplay_start_failed", message: (error as Error).message });
  }
}

export default withMethod(["POST"], handler);
