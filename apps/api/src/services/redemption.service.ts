import { usdToCredits } from "@thevault/domain/money";

import { redemptionRepository, walletRepository } from "../repositories";

export class RedemptionService {
  async create(userId: string, method: string, amountUsd: number, destination: string) {
    const credits = usdToCredits(amountUsd);
    await walletRepository.applyDebit(userId, credits, "Cash out request", `${method} -> ${destination}`);
    return redemptionRepository.create({
      userId,
      method: method as "gift_card" | "paypal" | "crypto",
      amountUsd,
      creditsDebited: credits,
      destinationMasked: destination,
    });
  }

  async list(userId: string) {
    return redemptionRepository.getByUser(userId);
  }
}
