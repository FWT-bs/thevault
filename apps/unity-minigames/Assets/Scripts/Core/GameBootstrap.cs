using System.Collections.Generic;
using TheVault.Core.Utilities;
using UnityEngine;

namespace TheVault.Core
{
    // Sits in the host scene on the `_Bootstrap` GameObject. Owns the
    // currently active MiniGame and forwards lifecycle events from the
    // ReactNativeBridge.
    public class GameBootstrap : MonoBehaviour
    {
        public static GameBootstrap Instance { get; private set; }

        public SessionManager Session { get; private set; }

        private IMiniGame _current;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);

            Application.targetFrameRate = 60;
            QualitySettings.vSyncCount = 0;

            Session = new SessionManager();
        }

        public void StartFromJson(string json)
        {
            if (string.IsNullOrEmpty(json))
            {
                ReactNativeBridge.Instance?.SendError(null, null, "empty_config", "Inbound config was empty");
                return;
            }

            GameConfig config;
            try
            {
                config = JsonUtility.FromJson<GameConfig>(json);
                // JsonUtility doesn't deserialise nested dictionaries. Pull
                // the "settings" object via the minimal JSON helper.
                config.Settings = JsonHelper.ExtractFlatStringMap(json, "settings");
            }
            catch (System.Exception e)
            {
                ReactNativeBridge.Instance?.SendError(null, null, "bad_config_json", e.Message);
                return;
            }

            if (config == null || string.IsNullOrEmpty(config.gameId))
            {
                ReactNativeBridge.Instance?.SendError(null, null, "missing_game_id", "Config missing gameId");
                return;
            }

            StopCurrent();

            if (!GameRegistry.TryResolve(config.gameId, out var game))
            {
                ReactNativeBridge.Instance?.SendError(
                    config.gameId,
                    config.sessionId,
                    "unknown_game",
                    $"No registered controller for gameId='{config.gameId}'. Registered: {string.Join(",", GameRegistry.RegisteredIds)}");
                return;
            }

            _current = game;
            Session.Begin(config);

            try
            {
                _current.StartGame(config);
                ReactNativeBridge.Instance?.SendReady(config.gameId, config.sessionId);
            }
            catch (System.Exception e)
            {
                ReactNativeBridge.Instance?.SendError(
                    config.gameId, config.sessionId, "start_failed", e.Message);
                StopCurrent();
            }
        }

        public void ExitCurrent(string sessionId)
        {
            if (_current == null) return;
            var gameId = Session.CurrentGameId;
            var sid = string.IsNullOrEmpty(sessionId) ? Session.CurrentSessionId : sessionId;

            StopCurrent();
            ReactNativeBridge.Instance?.SendExited(gameId, sid);
        }

        public void Pause()  { Time.timeScale = 0f; }
        public void Resume() { Time.timeScale = 1f; }

        // Called by MiniGame implementations when gameplay reaches a terminal
        // state. Decorates the result with session metadata, hands it to the
        // bridge, then tears down.
        public void Finish(GameResult result)
        {
            if (result == null) return;
            if (string.IsNullOrEmpty(result.sessionId)) result.sessionId = Session.CurrentSessionId;
            if (string.IsNullOrEmpty(result.gameId))    result.gameId    = Session.CurrentGameId;
            if (result.durationMs <= 0)                  result.durationMs = Session.ElapsedMs();
            result.type = "GAME_FINISHED";

            ReactNativeBridge.Instance?.SendFinished(result);
            StopCurrent();
        }

        private void StopCurrent()
        {
            if (_current != null)
            {
                try { _current.StopGame(); } catch { /* swallow on teardown */ }
                _current = null;
            }
            Session.End();
            Time.timeScale = 1f;
        }
    }
}
