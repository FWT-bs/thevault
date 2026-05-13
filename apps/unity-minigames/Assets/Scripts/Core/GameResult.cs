using System;

namespace TheVault.Core
{
    // Mirrors the `UnityGameFinishedMessage` Zod schema in
    // packages/contracts/src/schemas/unity.ts. JsonUtility-friendly.
    [Serializable]
    public class GameResult
    {
        public string type = "GAME_FINISHED";
        public string gameId;
        public string sessionId;
        public int score;
        public long durationMs;
        public bool won;
        public bool rewardEligible;
        public string eventsHash;       // optional, may be null
        public GameResultSummary summary;
    }

    [Serializable]
    public class GameResultSummary
    {
        public int level;
        public int mistakes;
        public int coinsCollected;
    }

    [Serializable]
    public class GameExitedMessage
    {
        public string type = "GAME_EXITED";
        public string gameId;
        public string sessionId;
    }

    [Serializable]
    public class GameReadyMessage
    {
        public string type = "GAME_READY";
        public string gameId;
        public string sessionId;
    }

    [Serializable]
    public class GameErrorMessage
    {
        public string type = "GAME_ERROR";
        public string gameId;
        public string sessionId;
        public string code;
        public string message;
    }
}
