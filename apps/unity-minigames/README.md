# Unity Mini-Games Host

One Unity project that hosts every Unity-side mini-game for **The Vault**.
React Native owns auth, navigation, wallet, ads, and reward granting. Unity
only renders gameplay and reports a final `GameResult` back through the
[`ReactNativeBridge`](Assets/Scripts/Core/ReactNativeBridge.cs).

See [`MIGRATION_UNITY.md`](../../MIGRATION_UNITY.md) at the repo root for the
end-to-end architecture, bridge message contracts, security model, and the
per-game migration checklist.

---

## Editor + tooling

| Tool | Version |
|---|---|
| Unity Editor | **6000.0 LTS** (Unity 6) — install via Unity Hub |
| iOS build support module | required |
| Android build support module | required (later phase) |
| Scripting backend | **IL2CPP** (both platforms) |
| API compatibility level | **.NET Standard 2.1** |
| Target architectures | iOS arm64, Android arm64-v8a |

> The repo only checks in `Assets/` and `ProjectSettings/`. Unity regenerates
> `Library/`, `Temp/`, `obj/`, etc. on first open (see [`.gitignore`](.gitignore)).

---

## First-time setup (Unity Editor)

The CLI generated the C# scripts and folder tree, but Unity-only artifacts
have to be created in the Editor. Do these once after cloning:

1. **Open the project** — Unity Hub → *Add* → select `apps/unity-minigames/`.
   Unity will import assets and generate the .csproj/.sln files.
2. **Create the host scene** — `File → New Scene → Basic (URP)` template,
   save it as `Assets/Scenes/UnityMiniGameHost.unity`.
3. **Add the bootstrap GameObject** — in the host scene, create an empty
   GameObject named `_Bootstrap`. Add the
   [`GameBootstrap`](Assets/Scripts/Core/GameBootstrap.cs) component to it.
4. **Add the bridge GameObject** — create another empty GameObject named
   exactly **`ReactNativeBridge`** (the name matters; React Native targets
   it by GameObject name when calling `UnitySendMessage`). Add the
   [`ReactNativeBridge`](Assets/Scripts/Core/ReactNativeBridge.cs) component.
5. **Set as the active scene** — `File → Build Settings → Add Open Scenes`,
   make `UnityMiniGameHost` index 0.
6. **Project Settings**
   - *Player → Other Settings → Scripting Backend* → **IL2CPP**
   - *Player → Other Settings → Api Compatibility Level* → **.NET Standard 2.1**
   - *Player → Resolution and Presentation → Default Orientation* → **Portrait**
     (or whatever the host RN screen forces; Plinko-style games are portrait)
   - *Quality* → set the default level to *Medium* for mobile, target **60 FPS**

---

## Building as a library (Unity-as-a-Library)

React Native links Unity as a static library, not as a standalone app.

### iOS

1. `File → Build Settings → iOS → Build`. Choose an output folder *outside*
   the repo (e.g. `~/UnityBuilds/thevault-ios`).
2. Unity emits an Xcode project containing a `UnityFramework.xcodeproj`.
3. The `@azesmway/react-native-unity` package expects that framework to be
   placed in the host iOS app at `ios/UnityLibrary/`. Follow the package
   docs for the latest copy/symlink steps — they change between releases.
4. Open `ios/thevault.xcworkspace` and verify `UnityFramework.framework`
   appears under *Frameworks, Libraries, and Embedded Content* with
   *Embed & Sign*.

### Android (deferred)

Not part of Phase 1 of the migration. When picked up:

1. `File → Build Settings → Android → Export Project`.
2. Copy the exported `unityLibrary/` into `android/` and register it as
   an included project in `settings.gradle`. The `@azesmway` README has
   the boilerplate.

---

## Folder layout

```
Assets/
  Scripts/
    Core/
      GameBootstrap.cs        # boot logic; reads inbound config, starts a game
      GameRegistry.cs         # maps gameId → MiniGame implementation
      GameConfig.cs           # POCO matching UnityGameConfig in TS contracts
      GameResult.cs           # POCO matching UnityGameFinishedMessage in TS
      ReactNativeBridge.cs    # Unity-side receiver + JSON sender
      SessionManager.cs       # tracks active sessionId, startTime, timing
      AudioManager.cs         # tiny SFX/BGM wrapper
      Pooling/SimplePool.cs   # GameObject pool to avoid Instantiate/Destroy
      Utilities/JsonHelper.cs # JsonUtility wrappers, array helper
    Games/
      Plinko/PlinkoController.cs  # vertical-slice game (Phase 2)
  Scenes/UnityMiniGameHost.unity  # created in Editor (step 2 above)
  Prefabs/                        # per-game prefabs
  Sprites/                        # spritesheets / atlases (use Sprite Atlas)
  Materials/                      # URP materials
  Audio/                          # SFX + BGM clips
```

---

## How a game is wired up

1. A new `MiniGame` subclass (`MonoBehaviour`) lives in `Assets/Scripts/Games/<Name>/`.
2. It's registered in [`GameRegistry`](Assets/Scripts/Core/GameRegistry.cs)
   under a stable `gameId` matching the TS `UnityGameId` enum.
3. On `StartGame(config)` it loads its own prefabs/scene-additive content
   and runs gameplay.
4. On end-of-game it calls
   `ReactNativeBridge.Instance.SendFinished(result)` with a populated
   `GameResult`. React Native receives a `GAME_FINISHED` message,
   submits the score to `/api/gameplay/complete`, and shows the reward
   screen. **Unity never grants currency directly.**

---

## Performance baseline

- Target **60 FPS** on iPhone 12 / Pixel 6 class hardware.
- Use [`SimplePool`](Assets/Scripts/Core/Pooling/SimplePool.cs) for any
  object spawned/destroyed during gameplay (Plinko balls, particles,
  Block Blast tiles).
- Pack sprites into Sprite Atlases per-game; never ship loose PNGs into the
  build.
- Compress audio to Vorbis at quality 50–70.
- Each game prefab/scene must stay loadable in < 200 ms on cold start.
