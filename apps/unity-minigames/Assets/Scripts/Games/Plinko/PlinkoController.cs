using System;
using System.Collections.Generic;
using TheVault.Core;
using TheVault.Core.Pooling;
using UnityEngine;

namespace TheVault.Games.Plinko
{
    // Vertical-slice Plinko. Required scene layout (set up in Editor):
    //
    //   PlinkoRoot                          (empty GameObject)
    //     ├─ PegField                       (GameObject + PlinkoPegField)
    //     ├─ Slots                          (empty parent transform)
    //     │    ├─ Slot0 (PlinkoSlot, BoxCollider2D trigger)
    //     │    ├─ Slot1 (PlinkoSlot, ...)
    //     │    └─ ...
    //     ├─ Walls                          (left + right + floor static colliders)
    //     ├─ SpawnPoint                     (empty Transform near top centre)
    //     └─ HudCanvas                      (Canvas + PlinkoHud)
    //
    // Drop one PlinkoController on PlinkoRoot, wire the SerializeField
    // references in the Inspector, then assign a Plinko prefab (with this
    // root + its children) into the PlinkoController.RegisterPrefab() call
    // below — OR set EditorAutowire = true and the registrar will load it
    // from Resources/Games/Plinko/PlinkoRoot.prefab.
    //
    // Settings the bridge can pass via GameConfig.settings:
    //   ballCount        int    default 10
    //   pegRows          int    default uses the value baked into PegField
    //   maxScore         int    safety clamp; default falls back to bounds
    //   ballSpawnJitterX float  ±X randomness on spawn, default 0.15
    public class PlinkoController : MonoBehaviour, IMiniGame
    {
        public const string GameId = "plinko";
        private const string PrefabResourcePath = "Games/Plinko/PlinkoRoot";

        [Header("Wired in Inspector")]
        [SerializeField] private PlinkoPegField _pegField;
        [SerializeField] private Transform _spawnPoint;
        [SerializeField] private Transform _slotsParent;
        [SerializeField] private GameObject _ballPrefab;
        [SerializeField] private PlinkoHud _hud;

        [Header("Tuning (overridable via GameConfig.settings)")]
        [SerializeField] private int _defaultBallCount = 10;
        [SerializeField] private float _ballSpawnJitterX = 0.15f;
        [SerializeField] private float _interDropSeconds = 0.6f;

        public event Action<int> OnScoreChanged;
        public event Action<int> OnDropsRemainingChanged;

        private GameConfig _config;
        private SimplePool _ballPool;
        private readonly List<PlinkoSlot> _slots = new List<PlinkoSlot>();
        private int _score;
        private int _dropsRemaining;
        private int _ballsInFlight;
        private float _nextDropAt;
        private bool _running;
        private bool _finished;
        private int _coinsCollected; // any nonzero slot counts

        public bool IsRunning => _running;

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.BeforeSceneLoad)]
        private static void Register()
        {
            GameRegistry.Register(GameId, () =>
            {
                // Prefer a curated prefab from Resources so the scene only
                // needs the bridge GameObjects. The prefab packages the peg
                // field, slots, walls, spawn point, HUD canvas, and this
                // controller component with all SerializeField refs wired.
                var prefab = Resources.Load<GameObject>(PrefabResourcePath);
                if (prefab == null)
                {
                    Debug.LogError($"[Plinko] Missing prefab at Resources/{PrefabResourcePath}.prefab. " +
                                   "Add it in the Unity Editor (see Games/Plinko/README in the project).");
                    return new GameObject("PlinkoController_Empty").AddComponent<PlinkoController>();
                }
                var instance = Instantiate(prefab);
                var controller = instance.GetComponentInChildren<PlinkoController>();
                if (controller == null)
                {
                    Debug.LogError("[Plinko] Prefab is missing the PlinkoController component.");
                    controller = instance.AddComponent<PlinkoController>();
                }
                return controller;
            });
        }

        public void StartGame(GameConfig config)
        {
            _config = config;
            _score = 0;
            _coinsCollected = 0;
            _ballsInFlight = 0;
            _finished = false;
            _running = true;
            _dropsRemaining = Mathf.Max(1, config != null ? config.GetInt("ballCount", _defaultBallCount) : _defaultBallCount);

            if (_pegField != null)
            {
                var rows = config?.GetInt("pegRows", 0) ?? 0;
                if (rows > 0) _pegField.Rows = rows;
                _pegField.Build();
            }
            else
            {
                Debug.LogWarning("[Plinko] No PegField assigned — pegs will not be generated.");
            }

            CollectSlots();

            if (_ballPrefab != null)
            {
                _ballPool = new SimplePool(_ballPrefab, prewarm: Mathf.Min(_dropsRemaining, 6), parent: transform);
            }
            else
            {
                Debug.LogError("[Plinko] Ball prefab not assigned — cannot run.");
                Fail("missing_ball_prefab", "Ball prefab not assigned");
                return;
            }

            _hud?.Bind(this);
            OnScoreChanged?.Invoke(_score);
            OnDropsRemainingChanged?.Invoke(_dropsRemaining);
            _nextDropAt = Time.time + 0.35f; // brief cinematic pause before the first drop
        }

        public void StopGame()
        {
            _running = false;
            if (_hud != null) _hud.Unbind(this);
            // PlinkoBootstrap's prefab instance gets torn down here; the
            // controller component goes with it.
            if (this != null && gameObject != null) Destroy(gameObject);
        }

        private void Update()
        {
            if (!_running || _finished) return;

            // Auto-drop the next ball until we run out, then wait for the
            // last ball to settle before completing.
            if (_dropsRemaining > 0 && Time.time >= _nextDropAt)
            {
                SpawnBall();
                _dropsRemaining--;
                OnDropsRemainingChanged?.Invoke(_dropsRemaining);
                _nextDropAt = Time.time + _interDropSeconds;
            }

            if (_dropsRemaining == 0 && _ballsInFlight == 0)
            {
                Finish();
            }
        }

        // -------------------------------------------------------------------
        // Spawning + scoring
        // -------------------------------------------------------------------

        private void SpawnBall()
        {
            if (_spawnPoint == null || _ballPool == null) return;
            var jitter = UnityEngine.Random.Range(-_ballSpawnJitterX, _ballSpawnJitterX);
            var pos = _spawnPoint.position + new Vector3(jitter, 0f, 0f);
            var go = _ballPool.Get(pos, Quaternion.identity);
            var ball = go.GetComponent<PlinkoBall>();
            if (ball == null)
            {
                Debug.LogError("[Plinko] Ball prefab is missing PlinkoBall component.");
                _ballPool.Release(go);
                return;
            }
            ball.Bind(this);
            _ballsInFlight++;
        }

        private void CollectSlots()
        {
            _slots.Clear();
            if (_slotsParent == null) return;
            _slotsParent.GetComponentsInChildren<PlinkoSlot>(true, _slots);
            foreach (var slot in _slots) slot.Bind(this);
            if (_slots.Count == 0)
            {
                Debug.LogWarning("[Plinko] No PlinkoSlot children under SlotsParent — scoring will not register.");
            }
        }

        public void OnSlotHit(PlinkoSlot slot, PlinkoBall ball)
        {
            if (_finished || !_running) return;
            if (ball == null) return;
            ball.NotifyScored();
            AddScore(slot.Points);
            DespawnBall(ball);
        }

        public void OnBallLost(PlinkoBall ball)
        {
            // Ball clipped the field. Treat as a zero-point despawn.
            DespawnBall(ball);
        }

        public void OnBallDespawn(PlinkoBall ball) => DespawnBall(ball);

        private void DespawnBall(PlinkoBall ball)
        {
            if (ball == null) return;
            ball.ResetPhysics();
            _ballPool?.Release(ball.gameObject);
            _ballsInFlight = Mathf.Max(0, _ballsInFlight - 1);
        }

        private void AddScore(int delta)
        {
            if (delta <= 0) return;
            _score += delta;
            _coinsCollected++;
            OnScoreChanged?.Invoke(_score);
        }

        // -------------------------------------------------------------------
        // Terminal states
        // -------------------------------------------------------------------

        private void Finish()
        {
            if (_finished) return;
            _finished = true;
            _running = false;

            var result = new GameResult
            {
                gameId         = GameId,
                sessionId      = _config?.sessionId,
                score          = _score,
                won            = _score > 0,
                rewardEligible = _score > 0,
                summary        = new GameResultSummary
                {
                    level          = 1,
                    mistakes       = 0,
                    coinsCollected = _coinsCollected,
                },
            };
            GameBootstrap.Instance.Finish(result);
        }

        private void Fail(string code, string message)
        {
            if (_finished) return;
            _finished = true;
            _running = false;
            ReactNativeBridge.Instance?.SendError(GameId, _config?.sessionId, code, message);
        }
    }
}
