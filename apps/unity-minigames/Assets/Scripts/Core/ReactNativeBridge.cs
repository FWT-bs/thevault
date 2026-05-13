using UnityEngine;

namespace TheVault.Core
{
    // The single MonoBehaviour that React Native sends messages to via
    // UnitySendMessage("ReactNativeBridge", "<MethodName>", "<json>"). The
    // GameObject hosting this component MUST be named exactly
    // "ReactNativeBridge" in the Unity scene — UnitySendMessage targets by
    // GameObject name.
    //
    // Outgoing: SendFinished / SendExited / SendReady / SendError. On iOS &
    // Android these reach React Native through the @azesmway/react-native-unity
    // package, which forwards Unity's UnityMessageManager.OnMessageReceived
    // into the JS onUnityMessage callback.
    public class ReactNativeBridge : MonoBehaviour
    {
        public static ReactNativeBridge Instance { get; private set; }

        [Tooltip("Set true to log every inbound/outbound message to the console.")]
        public bool VerboseLogging = false;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        // ------------------------------------------------------------------
        // Inbound: called by React Native via UnitySendMessage
        // ------------------------------------------------------------------

        // Expected payload: serialised UnityGameConfig (TS schema).
        // Bootstrap parses, looks the gameId up in GameRegistry, and starts it.
        public void OnStartGame(string json)
        {
            if (VerboseLogging) Debug.Log($"[Bridge] OnStartGame {json}");
            GameBootstrap.Instance?.StartFromJson(json);
        }

        // Player tapped "Exit" in the React Native header. Stop the game,
        // emit GAME_EXITED so RN can mark the session abandoned.
        public void OnExitGame(string sessionId)
        {
            if (VerboseLogging) Debug.Log($"[Bridge] OnExitGame {sessionId}");
            GameBootstrap.Instance?.ExitCurrent(sessionId);
        }

        // App backgrounded / foregrounded. The active MiniGame may want to
        // pause physics. Implementation is per-game; default is no-op.
        public void OnPause(string _)  => GameBootstrap.Instance?.Pause();
        public void OnResume(string _) => GameBootstrap.Instance?.Resume();

        // ------------------------------------------------------------------
        // Outbound: called by MiniGame implementations
        // ------------------------------------------------------------------

        public void SendFinished(GameResult result)
        {
            var json = JsonUtility.ToJson(result);
            Emit(json);
        }

        public void SendExited(string gameId, string sessionId)
        {
            var msg = new GameExitedMessage { gameId = gameId, sessionId = sessionId };
            Emit(JsonUtility.ToJson(msg));
        }

        public void SendReady(string gameId, string sessionId)
        {
            var msg = new GameReadyMessage { gameId = gameId, sessionId = sessionId };
            Emit(JsonUtility.ToJson(msg));
        }

        public void SendError(string gameId, string sessionId, string code, string message)
        {
            var msg = new GameErrorMessage
            {
                gameId = gameId,
                sessionId = sessionId,
                code = code,
                message = message,
            };
            Emit(JsonUtility.ToJson(msg));
        }

        private void Emit(string json)
        {
            if (VerboseLogging) Debug.Log($"[Bridge] → RN {json}");
            // The azesmway package injects a static UnityMessageManager that
            // both runtimes (iOS UnityFramework, Android UnityPlayer) hook
            // into. It is resolved by reflection so this assembly does not
            // need a hard reference at edit time.
            UnityMessageManagerProxy.Send(json);
        }
    }
}
