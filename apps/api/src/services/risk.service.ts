import { evaluateRisk, type RiskInput } from "@thevault/domain/risk";

type RiskReview = {
  id: string;
  userId: string;
  reason: string;
  status: "open" | "resolved";
  createdAt: string;
};

const reviewQueue: RiskReview[] = [];
const actionCounters = new Map<string, number>();
const suspiciousDevices = new Set<string>();

export class RiskService {
  async evaluate(input: RiskInput) {
    const key = `${input.userId}:${input.action}`;
    const count = (actionCounters.get(key) ?? 0) + 1;
    actionCounters.set(key, count);

    let level = evaluateRisk(input);
    if (count > 25) level = "review";
    if (input.deviceId && suspiciousDevices.has(input.deviceId)) level = "block";
    if (input.deviceId && count > 40) suspiciousDevices.add(input.deviceId);

    if (level !== "allow") {
      reviewQueue.unshift({
        id: crypto.randomUUID(),
        userId: input.userId,
        reason: `${input.action}:${level}`,
        status: "open",
        createdAt: new Date().toISOString(),
      });
    }
    return {
      level,
      reviewedAt: new Date().toISOString(),
      velocityCount: count,
      suspiciousDevice: Boolean(input.deviceId && suspiciousDevices.has(input.deviceId)),
    };
  }

  async reviews(userId?: string) {
    return userId ? reviewQueue.filter((r) => r.userId === userId) : reviewQueue;
  }
}
