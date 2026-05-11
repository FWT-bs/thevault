import { streakRepository } from "../repositories";

export class StreakService {
  async summary(userId: string) {
    return streakRepository.getSummary(userId);
  }

  async claim(userId: string) {
    const summary = await streakRepository.getSummary(userId);
    if (!summary.claimable) {
      throw new Error("Streak already claimed");
    }
    return streakRepository.claim(userId, 25);
  }
}
