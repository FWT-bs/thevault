// Copy-paste starter for a new in-app game.
//
// Steps to wire up a new game (see ./README.md for the full checklist):
//   1. Copy this folder to `components/games/<game-id>/`
//   2. Rename `StarterGame` → `<GameName>Game` everywhere
//   3. Replace `GAME_ID` and `MODE_OPTIONS` for your game
//   4. Build out `<GameName>Gameplay` with your real mechanics
//   5. Add a GAME_CONFIGS entry in `constants/gameTemplates.ts`
//   6. Add a thin route: `app/(games)/<game-id>.tsx`
//   7. Add the route name to `app/(games)/_layout.tsx`
//   8. Route to it from `app/games.tsx` and `app/(games)/games-in-app.tsx`

import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { V2 } from "../../../constants/glassPalette";
import { typography } from "../../../constants/typography";
import {
  createGameRoute,
  type GameModeOption,
  type GameplayScreenProps,
} from "../createGameRoute";

const GAME_ID = "my-game";

type StarterModeId = "classic" | "timed" | "daily";

const MODE_OPTIONS: ReadonlyArray<GameModeOption<StarterModeId>> = [
  { id: "classic", label: "Classic", description: "Balanced round with standard scoring." },
  { id: "timed", label: "Timed", description: "Fast round with a visible countdown." },
  { id: "daily", label: "Daily", description: "One shared challenge board for today." },
];

function StarterGameplay({
  title,
  modeLabel,
  accent,
  accentSoft,
  onQuit,
  onFinish,
}: GameplayScreenProps<StarterModeId>) {
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
    <View style={[styles.root, { backgroundColor: accentSoft }]}>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.topBar}>
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
          <Pressable
            onPress={onResume}
            accessibilityRole="button"
            style={({ pressed }) => [styles.pausePrimary, pressed && styles.pressed]}
          >
            <Text style={styles.pausePrimaryText}>Resume</Text>
          </Pressable>
          <Pressable
            onPress={onQuit}
            accessibilityRole="button"
            style={({ pressed }) => [styles.pauseSecondary, pressed && styles.pressed]}
          >
            <Text style={styles.pauseSecondaryText}>Exit Game</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const StarterGame = createGameRoute({
  gameId: GAME_ID,
  modeOptions: MODE_OPTIONS,
  GameplayScreen: StarterGameplay,
});

export default StarterGame;

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: 18 },
  topBar: {
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
  },
  gameSubtitle: { marginTop: 2, fontSize: 13, color: V2.muted },
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
  hudLabel: { fontSize: 11, color: V2.muted },
  hudValue: {
    ...typography.bold,
    maxWidth: "100%",
    marginTop: 3,
    fontSize: 18,
    color: V2.ink,
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
  pressed: { opacity: 0.78 },
  disabled: { opacity: 0.45 },
});
