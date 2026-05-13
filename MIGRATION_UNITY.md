# Unity Mini-Games Migration

Status: **Phase 0 + 1 + 2 committed.** No game is shipping through Unity yet — all 12 React Native games continue to run as-is. Phases 0+1 added the bridge plumbing behind a feature flag. Phase 2 added the Plinko gameplay C# (controller, ball, slot, peg field, HUD); the remaining work is Unity Editor — build the peg/ball/slot/root prefabs per `apps/unity-minigames/Assets/Scripts/Games/Plinko/README.md`. This document is the single source of truth for the migration.

---

## Goal

Move the **playable** parts of mini-games into a single Unity host project. Keep everything else (auth, navigation, wallet, ads, backend, reward granting, result screens, profile) in Expo/React Native exactly where it is today.

Unity owns:
- real-time gameplay loop, physics, collisions
- sprites, animations, particles
- in-session score calculation
- local win/loss/game-over state
- sending the final `GameResult` back to RN

React Native owns:
- login / auth (Supabase, Google, Apple)
- home, game select, profile, settings, wallet UI
- launching the Unity host fullscreen with a server-issued session
- listening for `GAME_FINISHED` / `GAME_EXITED` from Unity
- submitting the score to `/api/gameplay/complete`
- rewarded ads + lifecycle
- showing the result/reward screen

> **Unity must never grant currency, modify the wallet, or call the backend directly.** All trust flows through the backend.

---

## Architecture

```
┌────────────────────────────────────────────────────────────────────────────┐
│                     React Native (Expo SDK 54 / RN 0.81)                    │
│                                                                              │
│  GameLaunchPage (components/v2/GameLaunchPage.tsx)                          │
│        │                                                                     │
│        │  isUnityGameEnabled(gameId) ?                                       │
│        ▼                                                                     │
│  ┌──────────────────────────┐         ┌──────────────────────────────────┐  │
│  │ existing RN game screen  │   OR    │ UnityGameScreen.tsx              │  │
│  │ (components/games/*)     │         │  - POST /api/gameplay/start      │  │
│  │                          │         │  - mount <UnityView> fullscreen  │  │
│  └──────────────────────────┘         │  - send GameConfig to Unity      │  │
│                                       │  - await GAME_FINISHED           │  │
│                                       │  - POST /api/gameplay/complete   │  │
│                                       │  - show reward / ad / result     │  │
│                                       └──────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
                                       │
                       UnitySendMessage / UnityMessageManager
                                       │
┌────────────────────────────────────────────────────────────────────────────┐
│              Unity 6 host (apps/unity-minigames/)                            │
│                                                                              │
│  ReactNativeBridge (Assets/Scripts/Core/ReactNativeBridge.cs)               │
│        │  OnStartGame(json)                                                  │
│        ▼                                                                     │
│  GameBootstrap → GameRegistry.TryResolve(gameId) → IMiniGame.StartGame()   │
│                                                              │               │
│   ┌──────────┐  ┌─────────┐  ┌────────────┐  ┌──────────┐    │               │
│   │ Plinko   │  │ HighLow │  │ FruitMerge │  │ ...      │    │               │
│   └──────────┘  └─────────┘  └────────────┘  └──────────┘    │               │
│        │ GameResult                                            │               │
│        ▼                                                       │               │
│  ReactNativeBridge.SendFinished(result) ──────────────────────┘               │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Bridge contracts

The Zod schemas in [`packages/contracts/src/schemas/unity.ts`](packages/contracts/src/schemas/unity.ts) are authoritative. The C# POCOs in [`apps/unity-minigames/Assets/Scripts/Core/`](apps/unity-minigames/Assets/Scripts/Core/) must stay in sync field-for-field.

### React Native → Unity (`OnStartGame`)

```ts
type UnityGameConfig = {
  gameId: "plinko" | "high_low" | "fruit_merge" | "block_blast" | "water_sort" | "bricks_vs_balls" | "blackjack";
  sessionId: string;       // server-issued, never client-generated
  userId: string;
  difficulty: "easy" | "normal" | "hard";
  seed: number;            // for deterministic RNG; 0 = "use device entropy"
  settings: Record<string, string | number | boolean>;
};
```

### Unity → React Native (discriminated by `type`)

```ts
type UnityMessage =
  | { type: "GAME_READY";    gameId; sessionId; }
  | { type: "GAME_FINISHED"; gameId; sessionId; score; durationMs; won; rewardEligible; eventsHash?; summary?; }
  | { type: "GAME_EXITED";   gameId; sessionId; }
  | { type: "GAME_ERROR";    gameId?; sessionId?; code; message; };
```

`GAME_READY` is fired by the bridge when a game's `StartGame()` has returned cleanly. `GAME_FINISHED` is the only message that may trigger a reward — and only after the backend re-validates the score.

---

## Backend integration

Both endpoints already exist:

| Endpoint | Body in | Body out |
|---|---|---|
| `POST /api/gameplay/start` (`apps/api/api/gameplay/start.ts`) | `{ gameId, modeId }` | `{ session: {...} }` — use `session.id` as `sessionId` for Unity |
| `POST /api/gameplay/complete` (`apps/api/api/gameplay/complete.ts`) | `{ sessionId, score }` | `{ result, wallet }` — `result.rewardsCredits` drives reward UI |

**Next backend change (Phase 1):**
- `complete.ts` currently trusts `score` blindly. Before any Unity game ships, add sanity bounds (`UnityGameBounds` in the TS contracts): max score per `gameId`, min/max duration. Reject with `400 implausible_score`. The Unity bridge already includes `durationMs` so the server has everything it needs.

---

## Security / anti-cheat

| Concern | Mitigation |
|---|---|
| Tampered score in `GAME_FINISHED` | Backend clamps to `UnityGameBounds.maxScore`. Rejected scores yield zero reward. |
| Replayed `sessionId` | `complete.ts` should mark sessions terminal; any second submit returns the original result without re-paying. |
| Instant-finish exploit | Backend checks `durationMs >= bounds.minDurationMs`. |
| Idle-out exploit | Backend checks `durationMs <= bounds.maxDurationMs`. |
| Predictable RNG | `seed` is server-issued; for high-value modes the server can require a re-submitted `eventsHash` derived from the seeded event stream. |
| Direct wallet edits | Unity never sees wallet endpoints. The RN bridge does not expose them either. |

---

## Feature flag

Two layers — both must be on:

1. `EXPO_PUBLIC_USE_UNITY_MINIGAMES=true` in `.env.local` (or the EAS secret).
2. The `gameId` is listed in `UNITY_ENABLED_GAMES` inside [`constants/featureFlags.ts`](constants/featureFlags.ts).

This lets us flip the global switch in staging without exposing half-finished games to production.

Old React Native game implementations under `components/games/<name>/` are **kept** until the Unity equivalent has shipped in a release and replaced them through this flag. Do not delete RN game code preemptively.

---

## File-by-file change set

### Already added (Phase 0 — this commit)
- `MIGRATION_UNITY.md` — this doc
- `packages/contracts/src/schemas/unity.ts` — bridge Zod schemas + types
- `packages/contracts/src/index.ts` — re-export the schemas
- `.env.example` — `EXPO_PUBLIC_USE_UNITY_MINIGAMES`
- `constants/featureFlags.ts` — typed flag reader + per-game allowlist
- `apps/unity-minigames/` — Unity project skeleton
  - `README.md`, `.gitignore`
  - `Assets/Scripts/Core/GameBootstrap.cs`
  - `Assets/Scripts/Core/GameRegistry.cs`
  - `Assets/Scripts/Core/GameConfig.cs`
  - `Assets/Scripts/Core/GameResult.cs`
  - `Assets/Scripts/Core/ReactNativeBridge.cs`
  - `Assets/Scripts/Core/UnityMessageManagerProxy.cs`
  - `Assets/Scripts/Core/SessionManager.cs`
  - `Assets/Scripts/Core/AudioManager.cs`
  - `Assets/Scripts/Core/Pooling/SimplePool.cs`
  - `Assets/Scripts/Core/Utilities/JsonHelper.cs`
  - `Assets/Scripts/Games/Plinko/PlinkoController.cs` — auto-finish stub
  - Empty `Assets/Scenes/`, `Prefabs/`, `Sprites/`, `Materials/`, `Audio/` (Editor populates)

### Phase 1 — RN bridge + screen ✅
- `npm i @azesmway/react-native-unity@1.0.11` — installed. Permissive peer deps; uses new-architecture codegen so it builds on RN 0.81. Unverified on device until pods are re-installed.
- `services/unityBridge.ts` — typed `sendUnityConfig`/`Exit`/`Pause`/`Resume`, `parseUnityMessage` (Zod-validated), `isUnityAvailable()` capability probe.
- `app/(games)/unity-game.tsx` — fullscreen `UnityGameScreen` route. Owns: start session → mount `<UnityView>` → push `GameConfig` → handle `GAME_READY` / `FINISHED` / `EXITED` / `ERROR` → submit score → show reward overlay.
- `app/(games)/_layout.tsx` — registered the new `unity-game` screen in the Stack.
- `components/games/createGameRoute.tsx` — `handlePlay` now branches on `isUnityGameEnabled(gameId)` and routes to `/unity-game?gameId=…&modeId=…` for enabled games. **No existing RN game code was deleted.**
- `services/features/gameplay.ts` — `useCompleteGameSession` accepts optional `gameId` + `durationMs` so the backend can apply bounds.
- `apps/api/api/gameplay/complete.ts` — when the inbound `gameId` is a known `UnityGameId`, validates `durationMs` against `DEFAULT_UNITY_GAME_BOUNDS` (400 on implausible duration) and clamps `score` to the per-game cap. Legacy callers omit `gameId` and bypass the check.
- `packages/contracts/src/schemas/unity.ts` — `DEFAULT_UNITY_GAME_BOUNDS` table seeded with conservative placeholder maxes.
- `constants/featureFlags.ts` — added `getUnityGameId()` to translate dashed RN ids (`high-low`) to underscored Unity ids (`high_low`); both layers must align.
- `types/azesmway-react-native-unity.d.ts` — local module shim because the package's `types` field points to a path that doesn't exist on disk.

**Before this can run on a device:**
```
cd ios && pod install        # autolink the native UnityFramework bindings
cd .. && npm run ios          # build + launch the dev client
```
Do NOT run `npx expo prebuild --clean` — it will wipe the existing `ios/` folder which already contains custom Xcode settings.

### Phase 2 — Plinko end-to-end ✅ (script side); ⏳ (Editor side)
- `PlinkoController.cs` — replaced the auto-finish stub with a real gameplay loop: drops balls on an interval, scores slot hits, ends after the last ball settles, emits `GAME_FINISHED` with score + `coinsCollected`. Reads `ballCount` / `pegRows` from `GameConfig.settings`. Registers itself in `GameRegistry` and loads a `Resources/Games/Plinko/PlinkoRoot.prefab`.
- `PlinkoBall.cs` — Rigidbody2D ball with pooled spawn/despawn, lifetime safety net, reset between drops.
- `PlinkoSlot.cs` — trigger-based scoring bin; emits points to the controller.
- `PlinkoPegField.cs` — programmatic triangular peg generator (rows, spacing, top-row count all tunable).
- `PlinkoHud.cs` — minimal score + drops-remaining HUD (TMP-based).
- See `apps/unity-minigames/Assets/Scripts/Games/Plinko/README.md` for the **mandatory Editor wiring**: peg/ball/slot/root prefabs, scene hierarchy, camera setup, smoke-test snippet.
- **Still TODO** (you, in Unity Editor): create the 4 prefabs, drop `PlinkoRoot` under `Assets/Resources/Games/Plinko/`, configure the camera, set IL2CPP, export Unity-as-a-Library, wire into `ios/`, flip `UNITY_ENABLED_GAMES` to include `"plinko"`.

### Phase 3 — remaining games (incremental, one per PR)
See checklist below.

---

## Per-game migration checklist

UI guidance: every Unity game should pull colour from `constants/appPalette.ts` (`coolors.ts`, `glassPalette.ts`) so the look-and-feel matches the RN shell. Replicate the existing screen's layout where possible. If a game's RN implementation is layout-bound to React Native primitives (HTML-style flex, gradients) and replicating it inside Unity is uneconomical, ship a Unity version with the same colour palette but a layout that suits a Unity scene; **do not block migration on pixel-parity**.

| gameId in TS | Existing RN code | Unity priority | Notes |
|---|---|---|---|
| `plinko`         | `components/games/plinko/PlinkoGame.tsx`           | **P1** (vertical slice) | Physics-heavy; classic Unity fit. |
| `bricks_vs_balls`| `components/games/bricks-vs-balls/…`               | **P1** | Also physics-heavy. Same shell as Plinko. |
| `block_blast`    | `components/games/block-blast/BlockBlastGame.tsx`  | P2 | Grid + drag; Unity gives smoother drag/animation. |
| `fruit_merge`    | `components/games/fruit-merge/FruitMergeGame.tsx`  | P2 | Physics merging; Unity-friendly. |
| `water_sort`     | `components/games/water-sorter/WaterSorterGame.tsx`| P3 | Already fine in RN; only migrate if particles/animation are wanted. |
| `high_low`       | `components/games/high-low/HighLowGame.tsx`        | P3 | Trivial UI; **probably skip**. Keep RN. |
| `blackjack`      | `components/games/blackjack/BlackjackGame.tsx`     | P4 | Card UI; RN is fine. Migrate only if shared casino theming is desired. |
| `color-stack`, `coloring`, `jigsaw-puzzle`, `single-line`, `word-ladder` | various | not in scope | Not in initial Unity gameId enum. Add to `UnityGameIdSchema` if/when planned. |

Per-game template for each migration PR:

1. Add a `Games/<Name>/<Name>Controller.cs` implementing `IMiniGame`. Self-register with `GameRegistry`.
2. Add prefabs under `Assets/Prefabs/<Name>/` and per-game sprite atlas.
3. Read difficulty/level config from `GameConfig.GetInt/GetFloat/GetString`.
4. On gameplay end, build a `GameResult` and call `GameBootstrap.Instance.Finish(result)`.
5. Add the `gameId` to `UNITY_ENABLED_GAMES` in `constants/featureFlags.ts`.
6. Extend `UnityGameBounds` entries in the backend.
7. Re-export Unity-as-a-Library, run `npx expo run:ios` against a device.
8. Manual smoke test: launch from `GameLaunchPage`, play to completion, verify wallet credit equals server-computed reward.
9. After two release cycles with no regressions, delete the old `components/games/<name>/` implementation in a separate PR.

---

## Build & run

See [`apps/unity-minigames/README.md`](apps/unity-minigames/README.md) for the Unity Editor steps. Once the host scene exists and a Unity-as-a-Library export has been linked into `ios/`:

```bash
# In one terminal — Metro
npm start

# In another terminal — bring up the iOS dev client
npm run ios
```

The dev client requires `expo-dev-client`. Unity will not work inside Expo Go.

Android is deferred. When picked up:

```bash
npx expo prebuild --platform android
# then export Unity Android library and link per apps/unity-minigames/README.md
```

---

## Open questions / TODO before Phase 1 lands

- Verify `@azesmway/react-native-unity` builds against RN 0.81 + New Architecture. If not, switch to a hand-rolled native module (Swift `RCTViewManager` for iOS UnityFramework, Kotlin `ReactPackage` for Android UnityPlayer).
- Decide whether `GameplayService.startSession` should accept an optional `seed` so the server can return a deterministic RNG seed in the response — required for `eventsHash` verification.
- Confirm the existing `modeId` semantics are compatible with Unity-side `difficulty` (likely yes; `modeId` is per-game and richer).
