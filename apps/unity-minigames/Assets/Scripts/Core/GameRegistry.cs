using System;
using System.Collections.Generic;

namespace TheVault.Core
{
    // Maps a `gameId` (matching the UnityGameId enum in TS contracts) to a
    // factory producing a MiniGame controller. Games register themselves in
    // their own MonoBehaviour Awake() or via [RuntimeInitializeOnLoadMethod]
    // to avoid a hard reference from Core to every game.
    public static class GameRegistry
    {
        private static readonly Dictionary<string, Func<IMiniGame>> Factories =
            new Dictionary<string, Func<IMiniGame>>(StringComparer.Ordinal);

        public static void Register(string gameId, Func<IMiniGame> factory)
        {
            if (string.IsNullOrEmpty(gameId)) throw new ArgumentException("gameId required");
            if (factory == null) throw new ArgumentNullException(nameof(factory));
            Factories[gameId] = factory;
        }

        public static bool TryResolve(string gameId, out IMiniGame game)
        {
            if (Factories.TryGetValue(gameId, out var factory))
            {
                game = factory();
                return true;
            }
            game = null;
            return false;
        }

        public static IReadOnlyCollection<string> RegisteredIds => Factories.Keys;
    }

    public interface IMiniGame
    {
        // Mounts the game using the supplied config. The implementation owns
        // its own scene-additive content / prefabs.
        void StartGame(GameConfig config);

        // Tears down the game without sending a result. Called when the
        // player exits early. Should be idempotent.
        void StopGame();

        // True between StartGame and SendFinished/SendExited. Used by the
        // bootstrap to ignore duplicate config messages.
        bool IsRunning { get; }
    }
}
