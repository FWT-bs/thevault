# Plinko (vertical slice)

Five C# files in this folder plus the shared Core scripts in
`Assets/Scripts/Core/` are everything code-wise. The remaining work is in
Unity Editor: build one prefab, drop it under `Assets/Resources/Games/Plinko/`,
and the controller's `RuntimeInitializeOnLoadMethod` registrar will pick it
up.

Code layout:

| File | Role |
|---|---|
| `PlinkoController.cs`  | `IMiniGame` entry point. Owns score, drops, win/loss → `GameBootstrap.Finish()` |
| `PlinkoPegField.cs`    | Generates the triangular peg grid programmatically from a peg prefab |
| `PlinkoSlot.cs`        | Trigger collider at the bottom; awards points when a `PlinkoBall` enters |
| `PlinkoBall.cs`        | Rigidbody2D ball; pooled by `SimplePool` via the controller |
| `PlinkoHud.cs`         | TMP score + drops-remaining display (Canvas in scene) |

## Editor build steps (one-time)

### 1. Peg prefab — `Assets/Prefabs/Plinko/Peg.prefab`
- GameObject with `SpriteRenderer` (round white sprite tinted to a palette
  accent) and `CircleCollider2D` (radius matches sprite).
- No Rigidbody2D — pegs are static.

### 2. Ball prefab — `Assets/Prefabs/Plinko/Ball.prefab`
- GameObject with `SpriteRenderer` (small filled circle), `Rigidbody2D`
  (Dynamic, gravity 1, mass 0.2, drag 0.05, **interpolate = Interpolate**,
  **collision detection = Continuous**), `CircleCollider2D` with a
  `PhysicsMaterial2D` (bounciness 0.4, friction 0.05).
- Add the `PlinkoBall` component.

### 3. Slot prefab — `Assets/Prefabs/Plinko/Slot.prefab`
- GameObject with `BoxCollider2D` (`Is Trigger` = true), plus a child
  SpriteRenderer for the visual bin and a child TMP_Text for the multiplier
  label.
- Add the `PlinkoSlot` component. Set `Points` and `Label` per slot when
  you duplicate this prefab into a row of 7–9 slots.

### 4. PlinkoRoot prefab — `Assets/Resources/Games/Plinko/PlinkoRoot.prefab`
Folder must be inside `Resources/` — `PlinkoController` loads it by name.

Hierarchy:
```
PlinkoRoot                          (Empty GameObject + PlinkoController)
├─ PegField                          (Empty + PlinkoPegField, peg prefab assigned)
├─ Slots                             (Empty parent)
│   ├─ Slot 50  (Slot prefab, Points=50)
│   ├─ Slot 100 (Slot prefab, Points=100)
│   ├─ Slot 500 (Slot prefab, Points=500)
│   ├─ Slot 100 (...)
│   └─ Slot 50  (...)
├─ Walls                             (Empty parent with three static BoxCollider2D children: leftWall, rightWall, floor)
├─ SpawnPoint                        (Empty Transform near top centre)
└─ HudCanvas                         (Canvas, Screen Space — Camera, with PlinkoHud)
    ├─ ScoreText                     (TMP_Text wired into PlinkoHud._scoreLabel)
    └─ DropsText                     (TMP_Text wired into PlinkoHud._dropsLabel)
```

On the root `PlinkoController` component, wire SerializeField refs:
- `_pegField` → PegField
- `_spawnPoint` → SpawnPoint
- `_slotsParent` → Slots
- `_ballPrefab` → `Assets/Prefabs/Plinko/Ball.prefab`
- `_hud` → HudCanvas

### 5. Configure the camera

In `UnityMiniGameHost.unity` set the main camera to **orthographic**, size
~6, position centred above the PegField. The ball field is in local
coordinates around (0, 0).

## Tuning via the bridge

React Native can pass overrides through `GameConfig.settings` (free-form
string map). Today the controller reads:

| Key | Type | Default | Notes |
|---|---|---|---|
| `ballCount`        | int   | 10                  | Number of drops before the round ends |
| `pegRows`          | int   | (Inspector default) | Override the field height per session |

Add more by extending `PlinkoController.StartGame()` — settings are
typed via `GameConfig.GetInt/GetFloat/GetString/GetBool`.

## Smoke test (no backend)

In the Editor, open `UnityMiniGameHost.unity` and select the `_Bootstrap`
GameObject. With the scene playing, paste this into the immediate-mode
console (e.g. via a temporary button or just a hardcoded call in
`GameBootstrap.Awake()`):

```csharp
GameBootstrap.Instance.StartFromJson("{\"gameId\":\"plinko\",\"sessionId\":\"local\",\"userId\":\"u1\",\"difficulty\":\"normal\",\"seed\":42,\"settings\":{\"ballCount\":\"5\"}}");
```

Balls should fall, score should tick up, and after the 5th ball settles the
console will log the `GAME_FINISHED` JSON (because no native RN bridge is
attached in the Editor; `UnityMessageManagerProxy` logs it instead).
