import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { V2 } from "../../../constants/glassPalette";
import { typography } from "../../../constants/typography";
import { useGameProgress } from "../../../services/gameProgress";
import {
  createGameRoute,
  type GameModeOption,
  type GameplayScreenProps,
} from "../createGameRoute";
import { InAppGameShell, type SecondaryAction } from "../_template/InAppGameShell";

const GAME_ID = "water-sorter";

const TUTORIAL_BULLETS = [
  "Tap a tube to lift it, then tap another tube to pour.",
  "You can only pour onto an empty tube or one whose top color matches.",
  "Solve in fewer moves to earn a bigger bonus on Claim.",
];

type WaterSorterModeId = "easy" | "medium" | "hard";

const MODE_OPTIONS: ReadonlyArray<GameModeOption<WaterSorterModeId>> = [
  { id: "easy", label: "Easy", description: "3 colors, 2 spare tubes." },
  { id: "medium", label: "Medium", description: "5 colors, 2 spare tubes." },
  { id: "hard", label: "Hard", description: "7 colors, 1 spare tube." },
];

const MODE_SETTINGS: Record<
  WaterSorterModeId,
  { colors: number; emptyTubes: number; capacity: number }
> = {
  easy: { colors: 3, emptyTubes: 2, capacity: 4 },
  medium: { colors: 5, emptyTubes: 2, capacity: 4 },
  hard: { colors: 7, emptyTubes: 1, capacity: 4 },
};

const COLOR_PALETTE = [
  "#0EA5E9",
  "#22C55E",
  "#F59E0B",
  "#E11D48",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
  "#F97316",
] as const;

type Tube = number[]; // bottom-to-top color indices

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function buildLevel(level: number, mode: WaterSorterModeId): Tube[] {
  const settings = MODE_SETTINGS[mode];
  const rng = mulberry32(level * 9176 + mode.length * 31);
  const flat: number[] = [];
  for (let c = 0; c < settings.colors; c++) {
    for (let i = 0; i < settings.capacity; i++) flat.push(c);
  }
  // Fisher–Yates with seeded rng.
  for (let i = flat.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [flat[i], flat[j]] = [flat[j], flat[i]];
  }
  const tubes: Tube[] = [];
  for (let c = 0; c < settings.colors; c++) {
    tubes.push(flat.slice(c * settings.capacity, (c + 1) * settings.capacity));
  }
  for (let i = 0; i < settings.emptyTubes; i++) tubes.push([]);
  return tubes;
}

function tubeSolved(tube: Tube, capacity: number) {
  if (tube.length === 0) return true;
  if (tube.length !== capacity) return false;
  const first = tube[0];
  return tube.every((c) => c === first);
}

function allSolved(tubes: Tube[], capacity: number) {
  return tubes.every((t) => tubeSolved(t, capacity));
}

function canPour(source: Tube, dest: Tube, capacity: number) {
  if (source.length === 0) return false;
  if (dest.length >= capacity) return false;
  if (dest.length === 0) return true;
  return source[source.length - 1] === dest[dest.length - 1];
}

function applyPour(source: Tube, dest: Tube, capacity: number): { source: Tube; dest: Tube } {
  const src = source.slice();
  const dst = dest.slice();
  if (src.length === 0) return { source: src, dest: dst };
  const color = src[src.length - 1];
  while (src.length > 0 && src[src.length - 1] === color && dst.length < capacity) {
    dst.push(src.pop()!);
  }
  return { source: src, dest: dst };
}

function WaterSorterGameplay({
  title,
  modeId,
  modeLabel,
  accent,
  accentSoft,
  accentInk,
  onQuit,
  onFinish,
}: GameplayScreenProps<WaterSorterModeId>) {
  const settings = MODE_SETTINGS[modeId];
  const { width } = useWindowDimensions();
  const { progress, merge, markTutorialSeen } = useGameProgress(GAME_ID);

  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [paused, setPaused] = useState(false);
  const [tubes, setTubes] = useState<Tube[]>(() => buildLevel(1, modeId));
  const [moves, setMoves] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [history, setHistory] = useState<Tube[][]>([]);
  const [pour, setPour] = useState<{
    srcIdx: number;
    dstIdx: number;
    srcAfter: Tube;
    dstAfter: Tube;
    color: number;
  } | null>(null);
  const tiltAnim = useRef(new Animated.Value(0)).current;
  const streamAnim = useRef(new Animated.Value(0)).current;

  const isComplete = allSolved(tubes, settings.capacity);

  useEffect(() => {
    setTubes(buildLevel(level, modeId));
    setMoves(0);
    setSelected(null);
    setHistory([]);
  }, [level, modeId]);

  useEffect(() => {
    setLevel(1);
    setScore(0);
  }, [modeId]);

  useEffect(() => {
    if (progress && score > progress.bestScore) merge({ bestScore: score });
  }, [score, progress, merge]);

  useEffect(() => {
    if (progress) merge({ lastLevel: level });
  }, [level, progress, merge]);

  const tapTube = useCallback(
    (idx: number) => {
      if (isComplete) return;
      if (pour) return; // animation in flight
      if (selected === null) {
        if (tubes[idx].length === 0) return;
        setSelected(idx);
        return;
      }
      if (selected === idx) {
        setSelected(null);
        return;
      }
      const source = tubes[selected];
      const dest = tubes[idx];
      if (!canPour(source, dest, settings.capacity)) {
        // Switch selection instead of failing silently.
        if (tubes[idx].length > 0) setSelected(idx);
        else setSelected(null);
        return;
      }
      const { source: newSource, dest: newDest } = applyPour(source, dest, settings.capacity);
      const color = source[source.length - 1];
      const srcIdx = selected;
      const dstIdx = idx;

      // Capture the pour for the animation pass. State commits at the end.
      setPour({ srcIdx, dstIdx, srcAfter: newSource, dstAfter: newDest, color });
      setSelected(null);

      const tiltDir = dstIdx > srcIdx ? 1 : -1;
      tiltAnim.setValue(0);
      streamAnim.setValue(0);

      Animated.parallel([
        Animated.sequence([
          Animated.timing(tiltAnim, {
            toValue: tiltDir,
            duration: 220,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.delay(360),
          Animated.timing(tiltAnim, {
            toValue: 0,
            duration: 220,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.delay(180),
          Animated.timing(streamAnim, {
            toValue: 1,
            duration: 380,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        // Commit the new state.
        const next = tubes.slice();
        next[srcIdx] = newSource;
        next[dstIdx] = newDest;
        setHistory((items) => [...items, tubes].slice(-20));
        setTubes(next);
        setMoves((m) => m + 1);
        setPour(null);
      });
    },
    [tubes, selected, isComplete, settings.capacity, pour, tiltAnim, streamAnim],
  );

  const undo = useCallback(() => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((items) => items.slice(0, -1));
    setTubes(prev);
    setSelected(null);
    setMoves((m) => Math.max(0, m - 1));
  }, [history]);

  const restartLevel = useCallback(() => {
    setTubes(buildLevel(level, modeId));
    setMoves(0);
    setSelected(null);
    setHistory([]);
  }, [level, modeId]);

  const continueToNextLevel = useCallback(() => {
    const movesBonus = Math.max(0, 40 - moves) * 5;
    setScore((value) => value + 80 + movesBonus);
    setLevel((l) => l + 1);
  }, [moves]);

  const claimAndExit = useCallback(() => {
    const bonus = isComplete ? 80 + Math.max(0, 40 - moves) * 5 : 0;
    onFinish(score + bonus);
  }, [onFinish, score, isComplete, moves]);

  const hudPills = useMemo(
    () => [
      { label: "Level", value: String(level) },
      { label: "Moves", value: String(moves) },
      { label: "Score", value: String(score) },
    ],
    [level, moves, score],
  );

  const secondaryActions: SecondaryAction[] = useMemo(
    () => [
      { label: "Undo", icon: "arrow-undo", onPress: undo, disabled: history.length === 0 },
      { label: "Restart", icon: "refresh", onPress: restartLevel },
    ],
    [undo, restartLevel, history.length],
  );

  const totalTubes = tubes.length;
  const columns = totalTubes <= 5 ? totalTubes : Math.ceil(totalTubes / 2);
  const innerWidth = Math.min(width, 430) - 32; // accounts for shell padding
  const tubeWidth = Math.min(58, Math.max(36, Math.floor((innerWidth - (columns + 1) * 8) / columns)));
  const layerHeight = Math.min(28, Math.floor(tubeWidth * 0.62));
  const tubeHeight = layerHeight * settings.capacity + 20;

  return (
    <InAppGameShell
      title={title}
      subtitle={`${modeLabel} · Level ${level}`}
      accent={accent}
      accentSoft={accentSoft}
      accentInk={accentInk}
      hudPills={hudPills}
      levelComplete={
        isComplete
          ? {
              title: `Level ${level} sorted`,
              subtitle: `Solved in ${moves} move${moves === 1 ? "" : "s"}. Next level adds a tougher mix.`,
            }
          : null
      }
      onQuit={onQuit}
      onPause={() => setPaused(true)}
      paused={paused}
      onResume={() => setPaused(false)}
      onRestartLevel={() => {
        setPaused(false);
        restartLevel();
      }}
      onClaimExit={claimAndExit}
      onNextLevel={continueToNextLevel}
      secondaryActions={secondaryActions}
      tutorial={{
        visible: progress != null && !progress.tutorialSeen,
        title: "How to play Water Sorter",
        bullets: TUTORIAL_BULLETS,
        onDismiss: markTutorialSeen,
      }}
    >
      <View style={styles.body}>
        <View style={styles.hintCard}>
          <Text style={styles.hintLabel}>How to play</Text>
          <Text style={styles.hintBody}>
            Tap a tube to pick it up, then tap another to pour. Top colors must match — or the
            destination must be empty.
          </Text>
        </View>

        <View style={styles.boardWrap}>
          <View style={styles.tubeGrid}>
            {tubes.map((tube, idx) => {
              // During the pour animation, render the source/dest tubes with their
              // post-pour contents so the layers visibly "leave" the source and
              // "appear" in the dest while the source tilts.
              let displayTube = tube;
              let rotation: Animated.AnimatedInterpolation<string> | undefined;
              if (pour) {
                if (idx === pour.srcIdx) {
                  displayTube = pour.srcAfter;
                  const dir = pour.dstIdx > pour.srcIdx ? 1 : -1;
                  rotation = tiltAnim.interpolate({
                    inputRange: [-1, 0, 1],
                    outputRange: [`${-32 * dir}deg`, "0deg", `${32 * dir}deg`],
                  });
                } else if (idx === pour.dstIdx) {
                  displayTube = pour.dstAfter;
                }
              }
              return (
                <TubeView
                  key={idx}
                  tube={displayTube}
                  capacity={settings.capacity}
                  selected={selected === idx}
                  width={tubeWidth}
                  layerHeight={layerHeight}
                  height={tubeHeight}
                  accent={accent}
                  accentInk={accentInk}
                  rotation={rotation}
                  onPress={() => tapTube(idx)}
                />
              );
            })}
          </View>

          {/* Pouring "stream" — a vertical bar that fades out during the pour. */}
          {pour ? (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.pourStream,
                {
                  backgroundColor: COLOR_PALETTE[pour.color % COLOR_PALETTE.length],
                  opacity: streamAnim.interpolate({
                    inputRange: [0, 0.1, 0.9, 1],
                    outputRange: [0, 1, 1, 0],
                  }),
                  transform: [
                    {
                      scaleY: streamAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.4, 1.4],
                      }),
                    },
                  ],
                },
              ]}
            />
          ) : null}
        </View>

        <Text style={styles.statusText}>
          {selected !== null
            ? "Tap a destination — same top color or empty"
            : isComplete
              ? "All tubes sorted — claim or continue"
              : "Tap any tube to lift it"}
        </Text>
      </View>
    </InAppGameShell>
  );
}

function TubeView({
  tube,
  capacity,
  selected,
  width,
  layerHeight,
  height,
  accent,
  accentInk,
  rotation,
  onPress,
}: {
  tube: Tube;
  capacity: number;
  selected: boolean;
  width: number;
  layerHeight: number;
  height: number;
  accent: string;
  accentInk: string;
  rotation?: Animated.AnimatedInterpolation<string>;
  onPress: () => void;
}) {
  const emptyLayers = capacity - tube.length;
  return (
    <Animated.View
      style={{
        width,
        height,
        transform: rotation
          ? [{ translateY: selected ? -10 : 0 }, { rotate: rotation }]
          : [{ translateY: selected ? -10 : 0 }],
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={selected ? "Tube selected" : "Tube"}
        onPress={onPress}
        style={({ pressed }) => [
          styles.tubePressable,
          { width, height, transform: [{ scale: pressed ? 0.97 : 1 }] },
        ]}
      >
      <View
        style={[
          styles.tubeBody,
          {
            width,
            height,
            borderColor: selected ? accent : "rgba(0,0,0,0.14)",
            borderWidth: selected ? 3 : 2,
            backgroundColor: "rgba(255,255,255,0.95)",
          },
        ]}
      >
        {Array.from({ length: emptyLayers }).map((_, i) => (
          <View key={`e-${i}`} style={{ height: layerHeight }} />
        ))}
        {tube
          .slice()
          .reverse()
          .map((colorIdx, i) => (
            <View
              key={`f-${i}`}
              style={{
                height: layerHeight,
                backgroundColor: COLOR_PALETTE[colorIdx % COLOR_PALETTE.length],
                borderTopLeftRadius: emptyLayers === 0 && i === 0 ? 4 : 0,
                borderTopRightRadius: emptyLayers === 0 && i === 0 ? 4 : 0,
                borderBottomLeftRadius: i === tube.length - 1 ? 14 : 0,
                borderBottomRightRadius: i === tube.length - 1 ? 14 : 0,
              }}
            />
          ))}
      </View>
      {selected ? (
        <View style={[styles.tubeMarker, { borderColor: accentInk }]}>
          <Ionicons name="arrow-up" size={12} color={accentInk} />
        </View>
      ) : null}
      </Pressable>
    </Animated.View>
  );
}

const WaterSorterGame = createGameRoute<WaterSorterModeId>({
  gameId: "water-sorter",
  modeOptions: MODE_OPTIONS,
  GameplayScreen: WaterSorterGameplay,
});

export default WaterSorterGame;

const styles = StyleSheet.create({
  body: {
    flex: 1,
    gap: 10,
  },
  hintCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: V2.hairline,
    backgroundColor: "rgba(255,255,255,0.86)",
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  hintLabel: {
    ...typography.bold,
    fontSize: 10,
    color: V2.muted,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  hintBody: {
    ...typography.semibold,
    marginTop: 4,
    fontSize: 12,
    lineHeight: 16,
    color: V2.ink,
  },
  boardWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pourStream: {
    position: "absolute",
    alignSelf: "center",
    top: "30%",
    width: 6,
    height: 36,
    borderRadius: 3,
  },
  tubeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "flex-end",
    gap: 10,
    rowGap: 16,
    paddingHorizontal: 4,
  },
  tubePressable: {
    alignItems: "center",
    justifyContent: "flex-end",
  },
  tubeBody: {
    borderRadius: 18,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    overflow: "hidden",
    flexDirection: "column",
  },
  tubeMarker: {
    position: "absolute",
    top: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  statusText: {
    ...typography.bold,
    textAlign: "center",
    fontSize: 12,
    letterSpacing: 0.4,
    color: V2.muted,
    textTransform: "uppercase",
  },
});
