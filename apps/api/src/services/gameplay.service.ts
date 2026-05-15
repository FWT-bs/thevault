export class GameplayService {
  async startSession(userId: string, gameId: string, modeId: string) {
    return {
      id: crypto.randomUUID(),
      userId,
      gameId,
      modeId,
      startedAt: new Date().toISOString(),
    };
  }

  async completeSession(userId: string, sessionId: string, score: number) {
    const rewardsCredits = Math.max(0, Math.floor(score / 10));
    return {
      id: crypto.randomUUID(),
      userId,
      sessionId,
      score,
      rewardsCredits,
      completedAt: new Date().toISOString(),
    };
  }
}
