import { getSupabaseAdmin, isMockUserId, isSupabaseConfigured } from "../lib/supabase";

export class GameplayService {
  async startSession(userId: string, gameId: string, modeId: string) {
    if (isSupabaseConfigured() && !isMockUserId(userId)) {
      const result = await getSupabaseAdmin()
        .from("game_sessions")
        .insert({
          user_id: userId,
          game_id: gameId,
          mode_id: modeId,
          state: "started",
        })
        .select("id, user_id, game_id, mode_id, started_at")
        .single();
      if (result.error) throw new Error(result.error.message);
      return {
        id: result.data.id,
        userId: result.data.user_id,
        gameId: result.data.game_id,
        modeId: result.data.mode_id,
        startedAt: result.data.started_at,
      };
    }

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
    if (isSupabaseConfigured() && !isMockUserId(userId)) {
      const now = new Date().toISOString();
      const sessionUpdate = await getSupabaseAdmin()
        .from("game_sessions")
        .update({ state: "completed", completed_at: now })
        .eq("id", sessionId)
        .eq("user_id", userId);
      if (sessionUpdate.error) throw new Error(sessionUpdate.error.message);

      const result = await getSupabaseAdmin()
        .from("game_results")
        .insert({
          game_session_id: sessionId,
          user_id: userId,
          score,
          won: score > 0,
          rewards_credits: rewardsCredits,
        })
        .select("id, user_id, score, rewards_credits, created_at")
        .single();
      if (result.error) throw new Error(result.error.message);
      return {
        id: result.data.id,
        userId: result.data.user_id,
        sessionId,
        score: result.data.score,
        rewardsCredits: result.data.rewards_credits,
        completedAt: result.data.created_at,
      };
    }

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
