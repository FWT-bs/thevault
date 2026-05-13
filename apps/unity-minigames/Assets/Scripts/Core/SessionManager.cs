using UnityEngine;

namespace TheVault.Core
{
    // Tracks the active session id, gameId, and start time. Lives as a plain
    // C# object on GameBootstrap (not a MonoBehaviour) so games can read it
    // without a scene reference.
    public class SessionManager
    {
        public string CurrentSessionId { get; private set; }
        public string CurrentGameId    { get; private set; }
        public long   StartTimeMs      { get; private set; }
        public bool   IsActive         { get; private set; }

        public void Begin(GameConfig config)
        {
            CurrentSessionId = config?.sessionId;
            CurrentGameId    = config?.gameId;
            StartTimeMs      = NowMs();
            IsActive         = true;

            // Seed Unity's RNG so games can opt into deterministic runs by
            // calling Random.Range / Random.value without re-seeding.
            if (config != null && config.seed != 0)
            {
                Random.InitState(unchecked((int)config.seed));
            }
        }

        public void End()
        {
            CurrentSessionId = null;
            CurrentGameId    = null;
            StartTimeMs      = 0;
            IsActive         = false;
        }

        public long ElapsedMs() => IsActive ? NowMs() - StartTimeMs : 0;

        private static long NowMs() =>
            (long)(Time.realtimeSinceStartupAsDouble * 1000.0);
    }
}
