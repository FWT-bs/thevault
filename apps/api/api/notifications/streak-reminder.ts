import type { VercelRequest, VercelResponse } from "@vercel/node";

import { getRequestUserId } from "../../src/lib/auth";
import { fail, ok, withMethod } from "../../src/lib/http";
import { NotificationsService } from "../../src/services/notifications.service";

const service = new NotificationsService();

async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const result = await service.scheduleStreakReminder(await getRequestUserId(req));
    ok(res, { notification: result });
  } catch (error) {
    fail(res, 500, { code: "notifications_streak_failed", message: (error as Error).message });
  }
}

export default withMethod(["POST"], handler);
