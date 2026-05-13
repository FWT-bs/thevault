using System;
using System.Collections.Generic;
using UnityEngine;

namespace TheVault.Core
{
    // Mirrors the `UnityGameConfig` Zod schema in
    // packages/contracts/src/schemas/unity.ts. Keep field names in sync.
    [Serializable]
    public class GameConfig
    {
        public string gameId;
        public string sessionId;
        public string userId;
        public string difficulty = "normal";
        public long seed;

        // Unity's JsonUtility cannot deserialise Dictionary<string, T>, so the
        // raw "settings" object is decoded lazily by `GameBootstrap` via
        // SimpleJSON (or a minimal helper) and exposed through GetSetting().
        [NonSerialized] public Dictionary<string, string> Settings = new Dictionary<string, string>();

        public string GetString(string key, string fallback = null)
        {
            return Settings != null && Settings.TryGetValue(key, out var v) ? v : fallback;
        }

        public int GetInt(string key, int fallback = 0)
        {
            return int.TryParse(GetString(key), out var v) ? v : fallback;
        }

        public float GetFloat(string key, float fallback = 0f)
        {
            return float.TryParse(GetString(key), out var v) ? v : fallback;
        }

        public bool GetBool(string key, bool fallback = false)
        {
            var raw = GetString(key);
            if (raw == null) return fallback;
            return raw == "true" || raw == "1";
        }
    }
}
