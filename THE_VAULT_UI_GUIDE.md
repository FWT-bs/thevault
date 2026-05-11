# The Vault UI Guide

This is the single source of truth for UI work in this repo. Read this before changing screens, buttons, native tabs, in-app games, or blackjack.

## Repo Truths

- This is an Expo Router React Native app.
- Main routes live in `app/`.
- Shared UI lives in `components/`.
- Reusable constants live in `constants/`.
- Large game implementations should live under `components/games/<game-id>/`.
- Route files should stay thin. Example: `app/blackjack.tsx` only re-exports `components/games/blackjack/BlackjackGame.tsx`.
- Do not recreate old root HTML mockups or scattered Markdown specs. This file replaces them.
- Do not add a second blackjack route. There should be no `app/blackjack-new.tsx`.

## Canonical Blackjack

Use these files:

- Route: `app/blackjack.tsx`
- Implementation: `components/games/blackjack/BlackjackGame.tsx`
- Game metadata: `constants/gameTemplates.ts`
- Game library card: `app/games-in-app.tsx`
- Earn tab entry: `app/games.tsx`

Blackjack uses the shared launch page before the loader. There is no intermediate landing page in the active flow.

Blackjack launch flow:

- Game library play button opens `/blackjack`.
- `/blackjack` first renders `components/v2/GameLaunchPage.tsx`.
- `GameLaunchPage` gets copy and reward rows from `constants/gameTemplates.ts`.
- The launch page `Play Now` button advances to `components/v2/GameLoader.tsx`.
- `GameLoader` advances directly to blackjack gameplay.

Blackjack gameplay rules:

- Standard actions: deal, hit, stand, double.
- Dealer has a hidden hole card until reveal.
- Dealer draws to 17.
- Natural blackjack pays 3:2.
- Push returns the bet.
- Bust, win, lose, and blackjack should produce clear result overlays.
- Keep cards, chips, and buttons in the same soft Vault visual style.

## Native Tabs

Native tabs are defined in `app/(tabs)/_layout.tsx`.

Use `expo-router/unstable-native-tabs`:

```tsx
import { DynamicColorIOS } from "react-native";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";

export default function TabsLayout() {
  return (
    <NativeTabs
      minimizeBehavior="never"
      labelStyle={{
        color: DynamicColorIOS({ dark: "white", light: "black" }),
      }}
      tintColor={DynamicColorIOS({ dark: "white", light: "black" })}
    >
      <NativeTabs.Trigger name="home-tab">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>Home</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
```

Rules:

- Do not build a custom tab bar inside a screen.
- Use SF Symbols through `Icon sf`.
- Current tab routes are `home-tab`, `games-tab`, `wallet-tab`, and `profile-tab`.
- Screens inside tabs should use the existing `TabScreen` shell from `app/_tab-screen.tsx`.

## Screen Shells

Use `TabScreen` for main app pages:

```tsx
<TabScreen
  title="Earn"
  subtitle="Pick a game and start earning credits"
  backgroundColor={V2.bg}
  titleColor={V2.ink}
  subtitleColor={V2.muted}
>
  {content}
</TabScreen>
```

Rules:

- Let `TabScreen` handle safe area, status bar, header spacing, scrolling, and background.
- Keep tab screens flat and scannable.
- Do not put cards inside cards.
- Use repeated cards only for repeated items, modals, or focused tools.
- Keep route-level files small when a screen gets complex.

## Color And Surface Rules

Primary tokens:

- `V2.bg`: main warm app background.
- `V2.card`: white card surface.
- `V2.ink`: main text.
- `V2.muted`: secondary text.
- `V2.blueDeep`: strong filled CTA blue.
- `GT.cyan`, `GT.cyanSoft`, `GT.cyanInk`: in-app game blue family.
- `SOFT_BORDER = "rgba(0,0,0,0.10)"`.
- `HAIRLINE = "rgba(0,0,0,0.06)"`.

Use these pastel fills when a screen needs color:

- Sky: `#BAE6FD`, `#A9E5FF`, `#E6F3FF`
- Mint: `#9FE2B5`, `#CDEFD8`
- Peach: `#FFB389`, `#FFD7C2`
- Lavender: `#BFA8F0`, `#DED1FB`
- Sand: `#F6D98A`
- Coral: `#F4A4A4`

Rules:

- Prefer flat pastel fills and soft borders.
- Avoid heavy black borders.
- Avoid decorative gradient blobs.
- Avoid static drop shadows on normal cards. If a shadow is needed, keep it subtle and purposeful.
- Text should fit inside its parent on small phones.
- Letter spacing should usually be `0`; only small eyebrow labels may use positive spacing.

## Button Pattern

Important buttons should use a frame plus inner content pattern. This avoids React Native `Pressable` layout quirks and keeps text centered.

```tsx
<View style={styles.buttonFrame}>
  <Pressable
    onPress={onPress}
    disabled={disabled}
    style={({ pressed }) => [
      styles.buttonPressable,
      pressed && !disabled && styles.pressed,
    ]}
  >
    <View pointerEvents="none" style={styles.buttonContent}>
      <Ionicons name="play" size={15} color="#FFFFFF" />
      <Text style={styles.buttonText}>PLAY BLACKJACK</Text>
    </View>
  </Pressable>
</View>
```

```tsx
const styles = StyleSheet.create({
  buttonFrame: {
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.10)",
    backgroundColor: "#FFFFFF",
    padding: 2,
  },
  buttonPressable: {
    minHeight: 58,
    borderRadius: 27,
    backgroundColor: V2.blueDeep,
    overflow: "hidden",
  },
  buttonContent: {
    minHeight: 58,
    paddingHorizontal: 14,
    borderRadius: 27,
    backgroundColor: V2.blueDeep,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buttonText: {
    ...typography.bold,
    fontSize: 17,
    color: "#FFFFFF",
    letterSpacing: 0,
    textAlign: "center",
  },
});
```

Button rules:

- Put layout on the inner `View`, not only on `Pressable`.
- Give both the `Pressable` and inner content a `minHeight`.
- If the button has a colored fill, apply the fill to the inner content too.
- Use `pointerEvents="none"` on the inner content.
- Use `alignItems: "center"` and `justifyContent: "center"` for centered text.
- Use `gap` for icon/text spacing.
- Keep touch targets at least 44 by 44.
- Disabled state should lower opacity but preserve layout size.

## Icon Buttons

Use icon-only buttons for utility actions when the meaning is familiar.

```tsx
<Pressable
  accessibilityLabel="Settings"
  hitSlop={8}
  style={({ pressed }) => [
    styles.iconButton,
    pressed && styles.pressed,
  ]}
>
  <Ionicons name="settings-outline" size={21} color={GT.cyan} />
</Pressable>
```

```tsx
const styles = StyleSheet.create({
  iconButton: {
    width: 56,
    height: 56,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.10)",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
});
```

Rules:

- Always add `accessibilityLabel` to icon-only buttons.
- Prefer `Ionicons` or `MaterialCommunityIcons`.
- Do not hand-draw icons unless the icon library lacks the symbol.

## Liquid Glass Components

Existing components:

- `components/LiquidGlassCard.tsx`
- `components/LiquidGlassCard.ios.tsx`
- `components/LiquidGlassButton.tsx`
- `components/LiquidGlassButton.ios.tsx`
- `components/LiquidGlassChip.tsx`
- `components/LiquidGlassChip.ios.tsx`
- `components/HeroGlassButton.tsx`
- `components/HeroGlassButton.ios.tsx`
- `components/GlassSurface.tsx`

Rules:

- Use `LiquidGlassCard` where the surrounding screen already uses liquid glass.
- Use `HeroGlassButton` for colorful hero CTAs and icon-only play controls.
- Use `LiquidGlassButton` for system-like glass actions.
- On non-iOS, glass components fall back to React Native/BlurView implementations.
- Do not stack random translucent views to fake glass if a component already exists.

## In-App Game Template

Generic game launch flow:

- Game metadata goes in `constants/gameTemplates.ts`.
- Pre-loading launch page uses `components/v2/GameLaunchPage.tsx`.
- Generic loading screen uses `components/v2/GameLoader.tsx`.
- Real gameplay goes in `components/games/<game-id>/<GameName>.tsx`.
- Route file in `app/<game-id>.tsx` should be a thin export.

Example route:

```tsx
export { default } from "../components/games/blackjack/BlackjackGame";
```

Rules:

- Use one canonical route per playable game.
- Do not keep mock routes around for reference.
- Use the metadata config for launch and loading screens.
- After loading completes, route or transition directly into gameplay.

## Universal Game Build Template

Use this section as the handoff brief for any in-app game builder, including someone who does not have this repo. The finished work should drop into this app with the same route, launch, loading, and gameplay contract used by blackjack.

Target stack:

- Expo Router React Native.
- React function components with TypeScript.
- `@expo/vector-icons` for icons.
- `react-native-safe-area-context` for full-screen game pages.
- `moti` only for light entrance/progress animation.
- Existing Vault tokens from `constants/gameTemplates.ts`, `constants/glassPalette.ts`, and `constants/typography.ts`.

Required file shape:

```txt
constants/gameTemplates.ts
app/_layout.tsx
app/games.tsx
app/games-in-app.tsx
app/<game-id>.tsx
components/games/<game-id>/<GameName>Game.tsx
```

The external builder should deliver only the route file, the game implementation file, the `GAME_CONFIGS` entry, and the small navigation additions. Shared components such as `GameLaunchPage`, `GameLoader`, `GameArt`, `TabScreen`, and the gameplay API hooks already exist in this repo.

### End-to-end flow

1. User taps a game card or Play button in `app/games.tsx` or `app/games-in-app.tsx`.
2. Navigation opens one canonical route, for example `router.push("/blackjack")`.
3. The route re-exports the real game component from `components/games/<game-id>/`.
4. The game component starts in `phase === "launch"`.
5. The launch page lets the player choose a mode and tap the primary Play button.
6. The game route starts a gameplay session with `{ gameId, modeId }`.
7. The game route transitions to `phase === "loading"`.
8. `GameLoader` shows art, progress, and rotating tips from `GAME_CONFIGS`.
9. Loader completion transitions to `phase === "playing"`.
10. Gameplay owns all round state, score, pause, result, and reset behavior.
11. On a real finish condition, gameplay completes the session with `{ sessionId, score }`.
12. Result UI shows score, reward state, Play Again, and Exit.

Do not complete a real game's session from the library card. The library should only navigate. The game route owns session start and completion because it knows the selected mode, score, and finish condition.

### Metadata config

Every game needs one `GAME_CONFIGS` entry. This entry drives the launch page, loader, tips, art, tasks, and mode copy.

```tsx
// constants/gameTemplates.ts
"my-game": {
  id: "my-game",
  name: "My Game",
  tagline: "Short gameplay promise",
  accent: GT.cyan,
  accentSoft: GT.cyanSoft,
  accentInk: GT.cyanInk,
  art: "generic",
  modes: [
    { id: "classic", label: "Classic", sub: "Balanced scoring" },
    { id: "timed", label: "Timed", sub: "90 seconds", tag: "FAST" },
    { id: "daily", label: "Daily", sub: "One board today", tag: "NEW" },
  ],
  stats: [
    { label: "Best score", value: "0" },
    { label: "Rounds", value: "0" },
    { label: "Win rate", value: "0%" },
  ],
  tasks: [
    { l: "Finish 3 rounds", p: 0, t: 3, reward: "+10 CR" },
    { l: "Beat 2,500 points", p: 0, t: 1, reward: "+25 CR" },
    { l: "Play the daily mode", p: 0, t: 1, reward: "+15 CR" },
  ],
  tips: [
    "Keep the first tip useful, not decorative.",
    "Explain one strategic idea per tip.",
    "Mention mode-specific scoring only if it affects the next round.",
  ],
  launch: {
    heroTitle: "My",
    heroAccentTitle: "Game",
    heroDescription: "Play quick rounds.\nBuild score. Unlock rewards.",
    balanceLabel: "$4.82",
    levelLabel: "Gold",
    shareLabel: "45%",
    primaryLabel: "Play Now",
    secondaryLabel: "Practice",
    rows: [
      {
        icon: "rocket",
        title: "Today's Boost",
        body: "Complete 3 rounds to unlock",
        accentText: "+45% share reward.",
        badge: "+45% SHARE",
      },
      {
        icon: "target",
        title: "Daily Challenge",
        body: "Beat today's target:",
        accentText: "+25 CR",
        timer: "12:18:45",
      },
    ],
    footer: [
      { icon: "rules", label: "Rules" },
      { icon: "fairPlay", label: "Fair Play" },
      { icon: "rewards", label: "Rewards" },
    ],
  },
}
```

Config rules:

- Use a stable lowercase route id, such as `my-game`.
- Keep mode ids stable because they are sent to `/gameplay/start`.
- `heroDescription` can use one newline. Avoid long paragraphs.
- `tips` must be true gameplay tips because they rotate during loading.
- `art` can be `"blackjack"`, `"slots"`, `"puzzle"`, or `"generic"`. Add a new `GameArt` branch only when the game needs recognizable custom art.
- `footer` is metadata for rules/fair-play/rewards actions. Do not rely on it for core gameplay.

### Thin route

```tsx
// app/my-game.tsx
export { default } from "../components/games/my-game/MyGame";
```

Also register the route in `app/_layout.tsx`:

```tsx
<Stack.Screen
  name="my-game"
  options={{ headerShown: false, title: "My Game", animation: "fade" }}
/>
```

### Navigation from games screens

In `app/games.tsx`, the Play button should route to the real game:

```tsx
if (game.id === "my-game") router.push("/my-game");
```

In `app/games-in-app.tsx`, route and return before the fallback mock session code:

```tsx
if (game.id === "my-game") {
  router.push("/my-game");
  return;
}
```

This keeps the library responsive and prevents a real game from being auto-completed before the player actually plays.

### Game component scaffold

The game implementation should own the full flow after the library Play tap. Keep the route file thin and put this component under `components/games/<game-id>/`.

```tsx
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GameLaunchPage } from "../../v2/GameLaunchPage";
import { GameLoader } from "../../v2/GameLoader";
import { GAME_CONFIGS, GT } from "../../../constants/gameTemplates";
import { V2 } from "../../../constants/glassPalette";
import { typography } from "../../../constants/typography";
import {
  useCompleteGameSession,
  useStartGameSession,
} from "../../../services/features/gameplay";

type Phase = "launch" | "loading" | "playing" | "result";
type ModeId = "classic" | "timed" | "daily";

const GAME_ID = "my-game";
const MODE_OPTIONS = [
  { id: "classic", label: "Classic", description: "Balanced round with standard scoring." },
  { id: "timed", label: "Timed", description: "Fast round with a visible countdown." },
  { id: "daily", label: "Daily", description: "One shared challenge board for today." },
] satisfies Array<{ id: ModeId; label: string; description: string }>;

export default function MyGame() {
  const router = useRouter();
  const params = useLocalSearchParams<{ start?: string; mode?: ModeId }>();
  const cfg = GAME_CONFIGS[GAME_ID];
  const startSession = useStartGameSession();
  const completeSession = useCompleteGameSession();

  const [phase, setPhase] = useState<Phase>(
    params.start === "playing" ? "playing" : params.start === "loading" ? "loading" : "launch",
  );
  const [modeId, setModeId] = useState<ModeId>(params.mode ?? "classic");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [finalScore, setFinalScore] = useState(0);
  const [rewardLabel, setRewardLabel] = useState<string | null>(null);

  const mode = useMemo(
    () => MODE_OPTIONS.find((item) => item.id === modeId) ?? MODE_OPTIONS[0],
    [modeId],
  );

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/games-in-app");
  };

  const handlePlay = async () => {
    try {
      const started = await startSession.mutateAsync({ gameId: cfg.id, modeId });
      setSessionId(started.session.id);
    } catch {
      setSessionId(null);
    } finally {
      setPhase("loading");
    }
  };

  const finishGame = async (score: number) => {
    setFinalScore(score);
    if (sessionId) {
      try {
        const completed = await completeSession.mutateAsync({ sessionId, score });
        setRewardLabel(`+${completed.result.rewardsCredits} CR`);
      } catch {
        setRewardLabel("Pending verification");
      }
    } else {
      setRewardLabel("Practice result");
    }
    setPhase("result");
  };

  if (phase === "launch") {
    return (
      <GameLaunchPage
        gameConfig={cfg}
        modeOptions={MODE_OPTIONS}
        selectedModeId={modeId}
        onModeChange={(id) => setModeId(id as ModeId)}
        onBack={goBack}
        onPlay={handlePlay}
      />
    );
  }

  if (phase === "loading") {
    return <GameLoader gameConfig={cfg} onReady={() => setPhase("playing")} />;
  }

  if (phase === "result") {
    return (
      <ResultScreen
        title={cfg.name}
        score={finalScore}
        rewardLabel={rewardLabel ?? "Pending"}
        accent={cfg.accent}
        onPlayAgain={() => setPhase("launch")}
        onExit={goBack}
      />
    );
  }

  return (
    <GameplayScreen
      title={cfg.name}
      modeLabel={mode.label}
      accent={cfg.accent}
      accentSoft={cfg.accentSoft}
      onQuit={() => setPhase("launch")}
      onFinish={finishGame}
    />
  );
}
```

### Gameplay UI contract

Every game can have different mechanics, but the screen should keep the same structural zones so it feels native to The Vault.

Gameplay screen zones:

- Root: full-screen `View` with game-specific background and `SafeAreaView`.
- Top bar: back/quit icon button, game title, selected mode, and a compact score/credits/status pill.
- HUD row: score, timer/moves/lives, reward progress, and streak/combo if relevant.
- Primary playfield: board, cards, reels, grid, track, word area, or canvas-like arena. It should have a stable aspect ratio and fixed min height.
- Controls: bottom action row with the most common action as a filled primary button and secondary actions as icon buttons or compact pills.
- Feedback layer: transient success/error/combo messages that do not move the board.
- Pause/settings modal: sound, haptics, rules, restart, exit.
- Result modal or result screen: final score, reward state, Play Again, Exit.

Recommended component names inside `GameplayScreen`:

- `GameTopBar`
- `GameHud`
- `Playfield`
- `PrimaryControls`
- `PauseModal`
- `ResultScreen`
- Small domain pieces such as `Card`, `Tile`, `Piece`, `Reel`, `WordSlot`, `Enemy`, or `Projectile`.

### Gameplay screen starter

Replace the placeholder mechanics with the real game rules. Keep the layout contract.

```tsx
function GameplayScreen({
  title,
  modeLabel,
  accent,
  accentSoft,
  onQuit,
  onFinish,
}: {
  title: string;
  modeLabel: string;
  accent: string;
  accentSoft: string;
  onQuit: () => void;
  onFinish: (score: number) => void;
}) {
  const { width, height } = useWindowDimensions();
  const compact = width < 380;
  const shortScreen = height < 760;
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(12);
  const [paused, setPaused] = useState(false);

  const canAct = moves > 0;

  const handlePrimaryAction = () => {
    if (!canAct) return;
    const nextScore = score + 120;
    const nextMoves = moves - 1;
    setScore(nextScore);
    setMoves(nextMoves);
    if (nextMoves === 0) onFinish(nextScore);
  };

  return (
    <View style={[styles.gameRoot, { backgroundColor: accentSoft }]}>
      <SafeAreaView style={styles.gameSafe} edges={["top", "bottom"]}>
        <View style={styles.gameTopBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Exit game"
            hitSlop={8}
            onPress={onQuit}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          >
            <Ionicons name="chevron-back" size={22} color={V2.ink} />
          </Pressable>

          <View style={styles.titleBlock}>
            <Text numberOfLines={1} adjustsFontSizeToFit style={styles.gameTitle}>
              {title}
            </Text>
            <Text numberOfLines={1} style={styles.gameSubtitle}>
              {modeLabel}
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Pause game"
            hitSlop={8}
            onPress={() => setPaused(true)}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          >
            <Ionicons name="pause" size={20} color={V2.ink} />
          </Pressable>
        </View>

        <View style={styles.hudRow}>
          <HudPill label="Score" value={String(score)} />
          <HudPill label="Moves" value={String(moves)} />
          <HudPill label="Reward" value="Pending" />
        </View>

        <View
          style={[
            styles.playfield,
            compact && styles.playfieldCompact,
            shortScreen && styles.playfieldShort,
          ]}
        >
          <Text style={styles.playfieldTitle}>Build the real game board here</Text>
          <Text style={styles.playfieldHint}>
            Use fixed-size cells, cards, pieces, or lanes so the layout does not jump during play.
          </Text>
        </View>

        <View style={styles.controlDock}>
          <View style={styles.primaryFrame}>
            <Pressable
              accessibilityRole="button"
              disabled={!canAct}
              onPress={handlePrimaryAction}
              style={({ pressed }) => [
                styles.primaryPressable,
                !canAct && styles.disabled,
                pressed && canAct && styles.pressed,
              ]}
            >
              <View pointerEvents="none" style={[styles.primaryContent, { backgroundColor: accent }]}>
                <Ionicons name="play" size={16} color="#FFFFFF" />
                <Text numberOfLines={1} adjustsFontSizeToFit style={styles.primaryText}>
                  Play Turn
                </Text>
              </View>
            </Pressable>
          </View>
        </View>

        <PauseModal visible={paused} onResume={() => setPaused(false)} onQuit={onQuit} />
      </SafeAreaView>
    </View>
  );
}
```

### Result screen starter

```tsx
function ResultScreen({
  title,
  score,
  rewardLabel,
  accent,
  onPlayAgain,
  onExit,
}: {
  title: string;
  score: number;
  rewardLabel: string;
  accent: string;
  onPlayAgain: () => void;
  onExit: () => void;
}) {
  return (
    <View style={styles.resultRoot}>
      <SafeAreaView style={styles.resultSafe} edges={["top", "bottom"]}>
        <View style={styles.resultCard}>
          <Text style={styles.resultEyebrow}>{title}</Text>
          <Text style={styles.resultTitle}>Round complete</Text>
          <Text style={[styles.resultScore, { color: accent }]}>{score}</Text>
          <Text style={styles.resultReward}>{rewardLabel}</Text>

          <View style={styles.resultActions}>
            <Pressable onPress={onPlayAgain} style={[styles.resultPrimary, { backgroundColor: accent }]}>
              <Text style={styles.resultPrimaryText}>Play Again</Text>
            </Pressable>
            <Pressable onPress={onExit} style={styles.resultSecondary}>
              <Text style={styles.resultSecondaryText}>Exit</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
```

### Supporting pieces

```tsx
function HudPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.hudPill}>
      <Text style={styles.hudLabel}>{label}</Text>
      <Text numberOfLines={1} adjustsFontSizeToFit style={styles.hudValue}>
        {value}
      </Text>
    </View>
  );
}

function PauseModal({
  visible,
  onResume,
  onQuit,
}: {
  visible: boolean;
  onResume: () => void;
  onQuit: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onResume}>
      <View style={styles.modalScrim}>
        <View style={styles.pauseCard}>
          <Text style={styles.pauseTitle}>Paused</Text>
          <Pressable onPress={onResume} style={styles.pausePrimary}>
            <Text style={styles.pausePrimaryText}>Resume</Text>
          </Pressable>
          <Pressable onPress={onQuit} style={styles.pauseSecondary}>
            <Text style={styles.pauseSecondaryText}>Exit Game</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
```

### Baseline styles

These styles are intentionally generic. A real game can add board-specific styles, but should keep the same touch target, text fitting, and spacing rules.

```tsx
const styles = StyleSheet.create({
  gameRoot: { flex: 1 },
  gameSafe: { flex: 1, paddingHorizontal: 18 },
  gameTopBar: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: V2.hairline,
    alignItems: "center",
    justifyContent: "center",
  },
  titleBlock: { flex: 1, minWidth: 0, alignItems: "center" },
  gameTitle: {
    ...typography.bold,
    maxWidth: "100%",
    fontSize: 22,
    color: V2.ink,
    textAlign: "center",
    letterSpacing: 0,
    ...(Platform.OS === "android" ? { includeFontPadding: false } : {}),
  },
  gameSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: V2.muted,
    letterSpacing: 0,
  },
  hudRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  hudPill: {
    flex: 1,
    minHeight: 58,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: V2.hairline,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  hudLabel: { fontSize: 11, color: V2.muted, letterSpacing: 0 },
  hudValue: {
    ...typography.bold,
    maxWidth: "100%",
    marginTop: 3,
    fontSize: 18,
    color: V2.ink,
    letterSpacing: 0,
    fontVariant: ["tabular-nums"],
  },
  playfield: {
    flex: 1,
    minHeight: 340,
    marginTop: 14,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: V2.hairline,
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  playfieldCompact: { minHeight: 310 },
  playfieldShort: { minHeight: 280 },
  playfieldTitle: {
    ...typography.bold,
    fontSize: 20,
    color: V2.ink,
    textAlign: "center",
    letterSpacing: 0,
  },
  playfieldHint: {
    marginTop: 8,
    maxWidth: 270,
    fontSize: 13,
    lineHeight: 18,
    color: V2.muted,
    textAlign: "center",
  },
  controlDock: { paddingTop: 14, paddingBottom: 4 },
  primaryFrame: {
    borderRadius: 30,
    borderWidth: 1,
    borderColor: V2.hairlineStrong,
    backgroundColor: "#FFFFFF",
    padding: 2,
  },
  primaryPressable: {
    minHeight: 58,
    borderRadius: 27,
    overflow: "hidden",
  },
  primaryContent: {
    minHeight: 58,
    borderRadius: 27,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryText: {
    ...typography.bold,
    maxWidth: "82%",
    fontSize: 17,
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: 0,
  },
  modalScrim: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.36)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  pauseCard: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    padding: 18,
    gap: 10,
  },
  pauseTitle: {
    ...typography.bold,
    fontSize: 24,
    color: V2.ink,
    textAlign: "center",
    letterSpacing: 0,
  },
  pausePrimary: {
    minHeight: 50,
    borderRadius: 25,
    backgroundColor: V2.blueDeep,
    alignItems: "center",
    justifyContent: "center",
  },
  pausePrimaryText: { ...typography.bold, color: "#FFFFFF", fontSize: 16 },
  pauseSecondary: {
    minHeight: 50,
    borderRadius: 25,
    backgroundColor: V2.cyanSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  pauseSecondaryText: { ...typography.bold, color: V2.cyanInk, fontSize: 16 },
  resultRoot: { flex: 1, backgroundColor: GT.bg },
  resultSafe: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  resultCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: V2.hairline,
    padding: 22,
    alignItems: "center",
  },
  resultEyebrow: {
    ...typography.bold,
    fontSize: 12,
    color: V2.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  resultTitle: {
    ...typography.bold,
    marginTop: 8,
    fontSize: 28,
    color: V2.ink,
    textAlign: "center",
    letterSpacing: 0,
  },
  resultScore: {
    ...typography.bold,
    marginTop: 12,
    fontSize: 54,
    letterSpacing: 0,
    fontVariant: ["tabular-nums"],
  },
  resultReward: { marginTop: 6, fontSize: 15, color: V2.muted },
  resultActions: { width: "100%", gap: 10, marginTop: 20 },
  resultPrimary: {
    minHeight: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  resultPrimaryText: { ...typography.bold, color: "#FFFFFF", fontSize: 16 },
  resultSecondary: {
    minHeight: 52,
    borderRadius: 26,
    backgroundColor: V2.cyanSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  resultSecondaryText: { ...typography.bold, color: V2.cyanInk, fontSize: 16 },
  pressed: { opacity: 0.78 },
  disabled: { opacity: 0.45 },
});
```

### Game mechanic guidance

Use a proven library for established complex rules when one exists. Examples: chess, checkers, solitaire variants, word dictionaries, physics, collision systems, seeded random generation, or pathfinding. Hand-roll only small arcade loops, board interactions, scoring, and presentation logic.

State rules:

- Keep route flow state separate from game state. `phase` should only decide launch/loading/playing/result.
- Keep game state local to `GameplayScreen` or a reducer.
- Use deterministic helper functions for shuffling, dealing, board generation, win checks, scoring, and collision.
- Do not mutate arrays in place when rendering pieces, cards, words, or board cells.
- Use timers with cleanup in `useEffect`.
- Pause timers and animations when a modal is open.
- Keep the final scoring function in one place so API completion and result UI agree.

Reward rules:

- Start the session when the player taps Play on the launch page.
- Complete the session only after a real finish condition.
- Send the selected `modeId`.
- If the API fails, keep local gameplay usable and show `Pending verification` or `Practice result`.
- Never grant wallet credits directly in the client.

### UI quality checklist

Before handing off a new game:

- `games.tsx` routes to the game.
- `games-in-app.tsx` routes to the game and returns before mock completion.
- `app/_layout.tsx` has a single `Stack.Screen` for the route.
- `app/<game-id>.tsx` is a thin export.
- `constants/gameTemplates.ts` contains the config and stable mode ids.
- The launch page shows mode choices when more than one mode exists.
- The primary Play button starts a session, then shows `GameLoader`.
- `GameLoader` transitions into gameplay without an extra screen.
- The gameplay screen has a safe top bar, HUD, playfield, controls, pause, and result.
- Buttons use the frame plus inner content pattern for centered text.
- Icon-only controls have `accessibilityLabel`.
- Text uses `numberOfLines` or `adjustsFontSizeToFit` where it can be long.
- The playfield has stable dimensions and does not resize during play.
- Timers and intervals clean up when leaving the screen.
- Result UI exposes Play Again and Exit.
- No duplicate routes, mock routes, root HTML files, or one-off Markdown specs are left behind.

## Game Library Navigation

Blackjack should be launched with:

```tsx
router.push("/blackjack");
```

Gameplay direct start can use:

```tsx
router.push("/blackjack?start=playing");
```

Loader direct start can use:

```tsx
router.push("/blackjack?start=loading");
```

Rules:

- Do not push `/blackjack-new`.
- Do not create an extra stack screen for deleted routes.
- Make sure `app/_layout.tsx` lists only real routes.

## Text Alignment Rules

Button text:

- Use an inner content wrapper.
- Set `alignItems: "center"`.
- Set `justifyContent: "center"`.
- Set `textAlign: "center"` on the `Text`.
- Keep font size appropriate for the button height.
- Avoid negative letter spacing inside buttons.

Card titles:

- Use `numberOfLines` for compact cards.
- Do not let titles push CTAs down unpredictably.
- Use fixed-height icon areas in game cards.

Hero text:

- Center the title/subtitle only when the whole hero is centered.
- Do not place giant hero text inside cards.

## Accessibility

- Icon-only buttons require `accessibilityLabel`.
- Segmented controls require `accessibilityRole="button"` and `accessibilityState`.
- Keep tap targets at least 44 by 44.
- Do not rely on color alone for game state.
- Disabled buttons should still be visible enough to understand.

## Things Future Agents Should Not Do

- Do not use deleted HTML mockups as implementation truth.
- Do not recreate scattered docs.
- Do not make `blackjack-new`.
- Do not move blackjack back into `app/blackjack.tsx`.
- Do not reintroduce an intermediate blackjack landing page between loader and gameplay.
- Do not build a custom tab bar.
- Do not put layout-only styles directly on `Pressable` when the button has multiple children.
- Do not leave duplicate game routes, duplicate templates, or old mock files in the repo.
