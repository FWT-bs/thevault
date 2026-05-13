import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from "react-native";

import { V2 } from "../../../constants/glassPalette";
import { typography } from "../../../constants/typography";
import { useGameProgress } from "../../../services/gameProgress";
import {
  createGameRoute,
  type GameModeOption,
  type GameplayScreenProps,
} from "../createGameRoute";
import { InAppGameShell, type SecondaryAction } from "../_template/InAppGameShell";

const GAME_ID = "coloring";

const TUTORIAL_BULLETS = [
  "Pick a paint swatch, then tap any cell with that number.",
  "By Number mode rejects wrong colors and tracks mistakes.",
  "Free mode lets you paint any cell any color — no mistakes possible.",
];

type ColoringModeId = "free" | "number" | "timed";

const MODE_OPTIONS: ReadonlyArray<GameModeOption<ColoringModeId>> = [
  { id: "free", label: "Free", description: "Paint any region any color." },
  { id: "number", label: "By Number", description: "Match each region to its target color." },
  { id: "timed", label: "Timed", description: "By Number with a 90-second clock." },
];

// 12-wide × 10-tall pixel scenes. 0 = blank, 1..N = palette index.
type Scene = {
  name: string;
  width: number;
  height: number;
  grid: number[]; // length = width * height
  palette: { id: number; color: string; label: string }[];
};

function gridFromRows(rows: string[]): number[] {
  return rows.flatMap((row) => row.split("").map((ch) => parseInt(ch, 10)));
}

const SCENES: Scene[] = [
  {
    name: "Vault Heart",
    width: 12,
    height: 10,
    grid: gridFromRows([
      "000111001110",
      "001221112221",
      "012222222220",
      "012222222220",
      "002222222200",
      "000222222000",
      "000022220000",
      "000002200000",
      "000000300000",
      "000000000000",
    ]),
    palette: [
      { id: 1, color: "#FCA5A5", label: "Blush" },
      { id: 2, color: "#E11D48", label: "Cherry" },
      { id: 3, color: "#7C3AED", label: "Plum" },
    ],
  },
  {
    name: "Vault Star",
    width: 12,
    height: 10,
    grid: gridFromRows([
      "000001100000",
      "000012210000",
      "000122222100",
      "112222222111",
      "012222222210",
      "001222222100",
      "000122221000",
      "000133331000",
      "000133313000",
      "000130003000",
    ]),
    palette: [
      { id: 1, color: "#FACC15", label: "Gold" },
      { id: 2, color: "#F59E0B", label: "Amber" },
      { id: 3, color: "#0F172A", label: "Ink" },
    ],
  },
  {
    name: "Vault Key",
    width: 12,
    height: 10,
    grid: gridFromRows([
      "000011110000",
      "000122210000",
      "001233321000",
      "001233321000",
      "001233321000",
      "000122210000",
      "000022200000",
      "000002200000",
      "000022220000",
      "000020020000",
    ]),
    palette: [
      { id: 1, color: "#FDE68A", label: "Brass" },
      { id: 2, color: "#F59E0B", label: "Amber" },
      { id: 3, color: "#7C2D12", label: "Iron" },
    ],
  },
];

function ColoringGameplay({
  title,
  modeId,
  modeLabel,
  accent,
  accentSoft,
  accentInk,
  onQuit,
  onFinish,
}: GameplayScreenProps<ColoringModeId>) {
  const { progress, merge, markTutorialSeen } = useGameProgress(GAME_ID);
  const [sceneIdx, setSceneIdx] = useState(0);
  const [filled, setFilled] = useState<Record<number, number>>({}); // cellIdx -> paletteId
  const [activeColor, setActiveColor] = useState<number>(1);
  const [mistakes, setMistakes] = useState(0);
  const [paused, setPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState<number>(modeId === "timed" ? 90 : 0);
  const [boardWidth, setBoardWidth] = useState(0);

  const scene = SCENES[sceneIdx % SCENES.length];

  const totalCells = useMemo(
    () => scene.grid.reduce((acc, v) => acc + (v > 0 ? 1 : 0), 0),
    [scene.grid],
  );
  const filledCells = Object.keys(filled).length;
  const isComplete = totalCells > 0 && filledCells >= totalCells;

  useEffect(() => {
    setFilled({});
    setMistakes(0);
    setActiveColor(scene.palette[0]?.id ?? 1);
  }, [sceneIdx, scene.palette]);

  useEffect(() => {
    setSceneIdx(0);
    setScore(0);
    setTimer(modeId === "timed" ? 90 : 0);
  }, [modeId]);

  useEffect(() => {
    if (progress && score > progress.bestScore) merge({ bestScore: score });
  }, [score, progress, merge]);

  useEffect(() => {
    if (progress) merge({ lastLevel: sceneIdx + 1 });
  }, [sceneIdx, progress, merge]);

  // Timer for timed mode.
  useEffect(() => {
    if (modeId !== "timed") return;
    if (paused || isComplete) return;
    if (timer <= 0) return;
    const id = setInterval(() => setTimer((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [modeId, paused, isComplete, timer]);

  const tapCell = useCallback(
    (cellIdx: number) => {
      const target = scene.grid[cellIdx];
      if (target === 0) return;
      if (modeId === "free") {
        setFilled((map) => ({ ...map, [cellIdx]: activeColor }));
        return;
      }
      // By-number rule: only the matching paint sticks.
      if (target === activeColor) {
        setFilled((map) => ({ ...map, [cellIdx]: activeColor }));
      } else {
        setMistakes((m) => m + 1);
      }
    },
    [scene.grid, activeColor, modeId],
  );

  const resetScene = useCallback(() => {
    setFilled({});
    setMistakes(0);
    if (modeId === "timed") setTimer(90);
  }, [modeId]);

  const continueToNextLevel = useCallback(() => {
    const accuracyBonus = Math.max(0, 60 - mistakes * 5);
    const timeBonus = modeId === "timed" ? timer * 2 : 0;
    setScore((value) => value + 80 + accuracyBonus + timeBonus);
    setSceneIdx((i) => (i + 1) % SCENES.length);
    if (modeId === "timed") setTimer(90);
  }, [mistakes, modeId, timer]);

  const claimAndExit = useCallback(() => {
    onFinish(score + (isComplete ? 80 + Math.max(0, 60 - mistakes * 5) : 0));
  }, [onFinish, score, isComplete, mistakes]);

  const hudPills = useMemo(() => {
    const progressLabel = `${filledCells}/${totalCells}`;
    if (modeId === "timed") {
      return [
        { label: "Filled", value: progressLabel },
        { label: "Time", value: `${timer}s` },
        { label: "Score", value: String(score) },
      ];
    }
    return [
      { label: "Filled", value: progressLabel },
      { label: "Mistakes", value: String(mistakes) },
      { label: "Score", value: String(score) },
    ];
  }, [filledCells, totalCells, modeId, timer, mistakes, score]);

  const secondaryActions: SecondaryAction[] = useMemo(
    () => [{ label: "Restart", icon: "refresh", onPress: resetScene }],
    [resetScene],
  );

  const handleBoardLayout = (event: LayoutChangeEvent) => {
    setBoardWidth(event.nativeEvent.layout.width);
  };

  const cellSize = boardWidth > 0 ? Math.floor(boardWidth / scene.width) : 0;

  return (
    <InAppGameShell
      title={title}
      subtitle={`${modeLabel} · ${scene.name}`}
      accent={accent}
      accentSoft={accentSoft}
      accentInk={accentInk}
      hudPills={hudPills}
      levelComplete={
        isComplete
          ? {
              title: `${scene.name} complete`,
              subtitle: `${mistakes} mistake${mistakes === 1 ? "" : "s"}. Next picture loaded.`,
            }
          : modeId === "timed" && timer === 0
            ? {
                title: "Time's up",
                subtitle: `Filled ${filledCells}/${totalCells}. Claim or skip ahead.`,
              }
            : null
      }
      onQuit={onQuit}
      onPause={() => setPaused(true)}
      paused={paused}
      onResume={() => setPaused(false)}
      onRestartLevel={() => {
        setPaused(false);
        resetScene();
      }}
      onClaimExit={claimAndExit}
      onNextLevel={continueToNextLevel}
      secondaryActions={secondaryActions}
      tutorial={{
        visible: progress != null && !progress.tutorialSeen,
        title: "How to play Coloring",
        bullets: TUTORIAL_BULLETS,
        onDismiss: markTutorialSeen,
      }}
    >
      <View style={styles.body}>
        <View style={styles.hintCard}>
          <Text style={styles.hintLabel}>How to play</Text>
          <Text style={styles.hintBody}>
            {modeId === "free"
              ? "Pick any color and tap a cell to paint it. Free coloring — no wrong answer."
              : "Pick the color that matches each region's number. Wrong taps add to the mistake count."}
          </Text>
        </View>

        <View style={styles.boardWrap}>
          <View style={[styles.board, { borderColor: `${accentInk}33` }]} onLayout={handleBoardLayout}>
            {cellSize > 0
              ? scene.grid.map((value, idx) => {
                  if (value === 0) {
                    return (
                      <View
                        key={idx}
                        style={{ width: cellSize, height: cellSize }}
                      />
                    );
                  }
                  const paint = filled[idx];
                  const swatch = scene.palette.find((p) => p.id === value);
                  const fillColor = paint
                    ? scene.palette.find((p) => p.id === paint)?.color ?? "#EEE"
                    : "#FFFFFF";
                  return (
                    <Pressable
                      key={idx}
                      accessibilityRole="button"
                      accessibilityLabel={`Region ${value}`}
                      onPress={() => tapCell(idx)}
                      disabled={!!paint && modeId !== "free"}
                      style={({ pressed }) => [
                        styles.cell,
                        {
                          width: cellSize,
                          height: cellSize,
                          borderColor: paint ? "rgba(0,0,0,0.18)" : "rgba(0,0,0,0.32)",
                        },
                        pressed && { opacity: 0.78 },
                      ]}
                    >
                      <MotiView
                        key={paint ? `f-${paint}` : "empty"}
                        from={{ scale: paint ? 0.55 : 1, opacity: paint ? 0 : 1 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "timing", duration: 220 }}
                        style={[
                          StyleSheet.absoluteFillObject,
                          { backgroundColor: fillColor, alignItems: "center", justifyContent: "center" },
                        ]}
                      >
                        {!paint ? (
                          <Text
                            style={[
                              styles.cellNumber,
                              {
                                fontSize: Math.max(10, Math.floor(cellSize * 0.45)),
                                color: swatch?.color ?? accentInk,
                              },
                            ]}
                          >
                            {value}
                          </Text>
                        ) : null}
                      </MotiView>
                    </Pressable>
                  );
                })
              : null}
          </View>
        </View>

        <View style={styles.paletteRow}>
          {scene.palette.map((swatch) => {
            const isActive = swatch.id === activeColor;
            return (
              <Pressable
                key={swatch.id}
                accessibilityRole="button"
                accessibilityLabel={`Color ${swatch.label}`}
                onPress={() => setActiveColor(swatch.id)}
                style={({ pressed }) => [
                  styles.swatch,
                  {
                    borderColor: isActive ? accentInk : "rgba(0,0,0,0.2)",
                    borderWidth: isActive ? 3 : 2,
                  },
                  pressed && { transform: [{ scale: 0.96 }] },
                ]}
              >
                <View style={[styles.swatchDot, { backgroundColor: swatch.color }]}>
                  <Text style={styles.swatchNumber}>{swatch.id}</Text>
                </View>
                <Text style={styles.swatchLabel}>{swatch.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </InAppGameShell>
  );
}

const ColoringGame = createGameRoute<ColoringModeId>({
  gameId: "coloring",
  modeOptions: MODE_OPTIONS,
  GameplayScreen: ColoringGameplay,
});

export default ColoringGame;

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
  board: {
    width: "100%",
    aspectRatio: 12 / 10,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.86)",
    overflow: "hidden",
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  cellNumber: {
    ...typography.bold,
    letterSpacing: 0,
  },
  paletteRow: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
  },
  swatch: {
    flex: 1,
    minHeight: 64,
    borderRadius: 16,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  swatchDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  swatchNumber: {
    ...typography.bold,
    fontSize: 14,
    color: "#FFFFFF",
  },
  swatchLabel: {
    ...typography.semibold,
    fontSize: 11,
    color: V2.muted,
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
});
