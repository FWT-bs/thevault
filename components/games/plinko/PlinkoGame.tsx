import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, LayoutChangeEvent, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Rect } from "react-native-svg";

import { V2 } from "../../../constants/glassPalette";
import { typography } from "../../../constants/typography";
import { useGameProgress } from "../../../services/gameProgress";
import {
  createGameRoute,
  type GameModeOption,
  type GameplayScreenProps,
} from "../createGameRoute";
import { GameActionButton, InAppGameShell, type SecondaryAction } from "../_template/InAppGameShell";

const GAME_ID = "plinko";

const TUTORIAL_BULLETS = [
  "Use Left / Right to aim the drop column, then tap DROP.",
  "The center bucket pays the most — edges only pay a little.",
  "Spare balls after clearing the target lock in a bonus.",
];

type PlinkoModeId = "casual" | "ranked" | "expert";

const MODE_OPTIONS: ReadonlyArray<GameModeOption<PlinkoModeId>> = [
  { id: "casual", label: "Casual", description: "5 balls per level, gentle ramp." },
  { id: "ranked", label: "Ranked", description: "5 balls, higher targets each level." },
  { id: "expert", label: "Expert", description: "3 balls, dense pegs from the start." },
];

type LevelDef = {
  balls: number;
  target: number;
  pegRows: number;
};

const LEVELS: Record<PlinkoModeId, LevelDef[]> = {
  casual: [
    { balls: 6, target: 100, pegRows: 6 },
    { balls: 6, target: 180, pegRows: 7 },
    { balls: 5, target: 250, pegRows: 7 },
    { balls: 5, target: 350, pegRows: 8 },
    { balls: 4, target: 450, pegRows: 8 },
  ],
  ranked: [
    { balls: 5, target: 150, pegRows: 7 },
    { balls: 5, target: 280, pegRows: 8 },
    { balls: 4, target: 380, pegRows: 8 },
    { balls: 4, target: 500, pegRows: 9 },
    { balls: 3, target: 600, pegRows: 9 },
  ],
  expert: [
    { balls: 3, target: 200, pegRows: 8 },
    { balls: 3, target: 350, pegRows: 9 },
    { balls: 3, target: 500, pegRows: 9 },
    { balls: 2, target: 650, pegRows: 10 },
  ],
};

function bucketScores(buckets: number): number[] {
  // V-shape: center is highest, edges low.
  const middle = (buckets - 1) / 2;
  return Array.from({ length: buckets }, (_, i) => {
    const distance = Math.abs(i - middle);
    if (distance < 0.6) return 100;
    if (distance < 1.6) return 50;
    if (distance < 2.6) return 25;
    return 10;
  });
}

function simulatePath(startCol: number, rows: number): number[] {
  // Walks down the staggered pegs; the column count alternates rows+1, rows etc.
  // We simulate a coarse left/right bounce, returning column index at each row.
  let column = startCol;
  const path: number[] = [column];
  for (let r = 0; r < rows; r++) {
    const direction = Math.random() < 0.5 ? -1 : 1;
    column = Math.max(0, Math.min(rows, column + (direction > 0 ? 1 : 0)));
    // Shift selection probability if at edge.
    path.push(column);
  }
  return path;
}

function PlinkoGameplay({
  title,
  modeId,
  modeLabel,
  accent,
  accentSoft,
  accentInk,
  onQuit,
  onFinish,
}: GameplayScreenProps<PlinkoModeId>) {
  const levelsForMode = LEVELS[modeId];
  const { progress, merge, markTutorialSeen } = useGameProgress(GAME_ID);

  const [levelIdx, setLevelIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [paused, setPaused] = useState(false);
  const [ballsLeft, setBallsLeft] = useState(levelsForMode[0].balls);
  const [dropCol, setDropCol] = useState(Math.floor(levelsForMode[0].pegRows / 2));
  const [dropping, setDropping] = useState(false);
  const [activePath, setActivePath] = useState<{ xs: number[]; ys: number[] } | null>(null);
  const [lastBucket, setLastBucket] = useState<{ idx: number; value: number } | null>(null);
  const [boardSize, setBoardSize] = useState({ width: 0, height: 0 });
  const dropProgress = useRef(new Animated.Value(0)).current;
  const dropAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  const level = levelsForMode[levelIdx % levelsForMode.length];
  const buckets = level.pegRows + 1;
  const scoreTable = useMemo(() => bucketScores(buckets), [buckets]);
  const targetReached = score >= level.target;
  const noBallsLeft = ballsLeft <= 0;

  // Reset per-level state.
  useEffect(() => {
    setBallsLeft(level.balls);
    setScore(0);
    setDropCol(Math.floor(level.pegRows / 2));
    setActivePath(null);
    setLastBucket(null);
  }, [levelIdx, level.balls, level.pegRows]);

  useEffect(() => {
    setLevelIdx(0);
    setTotalScore(0);
  }, [modeId]);

  useEffect(() => {
    if (progress && totalScore + score > progress.bestScore) {
      merge({ bestScore: totalScore + score });
    }
  }, [totalScore, score, progress, merge]);

  useEffect(() => {
    if (progress) merge({ lastLevel: levelIdx + 1 });
  }, [levelIdx, progress, merge]);

  useEffect(() => () => {
    if (dropAnimRef.current) dropAnimRef.current.stop();
  }, []);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setBoardSize({ width, height });
  };

  const dropBall = useCallback(() => {
    if (dropping || noBallsLeft || targetReached) return;
    if (boardSize.width === 0) return;

    const pegRows = level.pegRows;
    const colSpacing = boardSize.width / (pegRows + 1);
    const selectorH = 40;
    const bucketH = 36;
    const playH = Math.max(boardSize.height - selectorH - bucketH - 8, 0);
    const rowSpacing = pegRows > 0 ? playH / (pegRows + 1) : 0;
    const colX = (col: number) => colSpacing / 2 + col * colSpacing;

    const path = simulatePath(dropCol, pegRows);
    const xs = path.map((c) => colX(c));
    const ys = path.map((_, idx) => selectorH + rowSpacing * (idx + 1) - rowSpacing / 2);
    // Final resting position is in the bucket band.
    xs.push(colX(path[path.length - 1]));
    ys.push(boardSize.height - bucketH / 2);

    setDropping(true);
    setBallsLeft((b) => b - 1);
    setActivePath({ xs, ys });
    dropProgress.setValue(0);

    const duration = Math.max(900, 130 * pegRows + 300);
    if (dropAnimRef.current) dropAnimRef.current.stop();
    dropAnimRef.current = Animated.timing(dropProgress, {
      toValue: 1,
      duration,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    });
    dropAnimRef.current.start(({ finished }) => {
      if (!finished) return;
      const finalCol = path[path.length - 1];
      const bucketIdx = Math.max(0, Math.min(buckets - 1, finalCol));
      const value = scoreTable[bucketIdx];
      setScore((s) => s + value);
      setLastBucket({ idx: bucketIdx, value });
      setActivePath(null);
      setDropping(false);
    });
  }, [
    dropping,
    noBallsLeft,
    targetReached,
    boardSize,
    dropCol,
    level.pegRows,
    buckets,
    scoreTable,
    dropProgress,
  ]);

  const moveSelector = useCallback(
    (delta: number) => {
      if (dropping) return;
      setDropCol((c) => Math.max(0, Math.min(level.pegRows, c + delta)));
    },
    [dropping, level.pegRows],
  );

  const restartLevel = useCallback(() => {
    if (dropAnimRef.current) dropAnimRef.current.stop();
    setBallsLeft(level.balls);
    setScore(0);
    setDropCol(Math.floor(level.pegRows / 2));
    setActivePath(null);
    setLastBucket(null);
    setDropping(false);
  }, [level.balls, level.pegRows]);

  const continueToNextLevel = useCallback(() => {
    setTotalScore((value) => value + score + Math.max(0, ballsLeft) * 25);
    setLevelIdx((idx) => (idx + 1) % levelsForMode.length);
  }, [score, ballsLeft, levelsForMode.length]);

  const claimAndExit = useCallback(() => {
    onFinish(totalScore + score);
  }, [onFinish, totalScore, score]);

  const hudPills = useMemo(
    () => [
      { label: "Score", value: `${score}/${level.target}` },
      { label: "Balls", value: String(ballsLeft) },
      { label: "Level", value: String(levelIdx + 1) },
    ],
    [score, level.target, ballsLeft, levelIdx],
  );

  const secondaryActions: SecondaryAction[] = useMemo(
    () => [
      { label: "Restart", icon: "refresh", onPress: restartLevel },
    ],
    [restartLevel],
  );

  // Layout math.
  const innerWidth = boardSize.width;
  const innerHeight = boardSize.height;
  const pegRows = level.pegRows;
  const selectorH = 40;
  const bucketH = 36;
  const playH = Math.max(innerHeight - selectorH - bucketH - 8, 0);
  const rowSpacing = pegRows > 0 ? playH / (pegRows + 1) : 0;
  const colSpacing = innerWidth / (pegRows + 1);

  const colX = (col: number) => colSpacing / 2 + col * colSpacing;

  return (
    <InAppGameShell
      title={title}
      subtitle={`${modeLabel} · Level ${levelIdx + 1}`}
      accent={accent}
      accentSoft={accentSoft}
      accentInk={accentInk}
      hudPills={hudPills}
      levelComplete={
        targetReached
          ? {
              title: `Level ${levelIdx + 1} cleared`,
              subtitle: `Hit ${score} (target ${level.target}). ${ballsLeft} ball${ballsLeft === 1 ? "" : "s"} spare — bonus locked in.`,
            }
          : noBallsLeft
            ? {
                title: "Out of balls",
                subtitle: `You banked ${score} this round. Tap restart or move on.`,
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
      nextLevelLabel={targetReached ? "Next level" : "Skip level"}
      secondaryActions={secondaryActions}
      tutorial={{
        visible: progress != null && !progress.tutorialSeen,
        title: "How to play Plinko",
        bullets: TUTORIAL_BULLETS,
        onDismiss: markTutorialSeen,
      }}
    >
      <View style={styles.body}>
        <View style={styles.boardFrame} onLayout={handleLayout}>
          {innerWidth > 0 && innerHeight > 0 ? (
            <Svg width={innerWidth} height={innerHeight}>
              {/* Drop selector lane */}
              <Rect
                x={0}
                y={0}
                width={innerWidth}
                height={selectorH}
                fill="rgba(255,255,255,0.78)"
                rx={12}
              />
              <Circle
                cx={colX(dropCol)}
                cy={selectorH / 2}
                r={12}
                fill={accent}
                stroke={accentInk}
                strokeWidth={2}
              />

              {/* Pegs (staggered rows). */}
              {Array.from({ length: pegRows }).map((_, r) => {
                const cols = r % 2 === 0 ? pegRows : pegRows + 1;
                const offset = r % 2 === 0 ? colSpacing : colSpacing / 2;
                const y = selectorH + rowSpacing * (r + 1);
                return Array.from({ length: cols }).map((__, c) => {
                  const x = offset + c * colSpacing;
                  if (x < 8 || x > innerWidth - 8) return null;
                  return (
                    <Circle
                      key={`peg-${r}-${c}`}
                      cx={x}
                      cy={y}
                      r={4}
                      fill={accentInk}
                      opacity={0.85}
                    />
                  );
                });
              })}

              {/* Buckets */}
              {Array.from({ length: buckets }).map((_, i) => {
                const w = innerWidth / buckets;
                const fill =
                  lastBucket?.idx === i
                    ? accent
                    : i % 2 === 0
                      ? "rgba(0,0,0,0.05)"
                      : "rgba(0,0,0,0.08)";
                return (
                  <Rect
                    key={`bucket-${i}`}
                    x={i * w + 2}
                    y={innerHeight - bucketH + 2}
                    width={w - 4}
                    height={bucketH - 4}
                    rx={8}
                    fill={fill}
                    stroke={accentInk}
                    strokeOpacity={0.18}
                  />
                );
              })}
            </Svg>
          ) : null}

          {/* Bucket score labels — rendered as Text so they look right on RN. */}
          <View style={[styles.bucketRow, { width: innerWidth, height: bucketH }]}>
            {Array.from({ length: buckets }).map((_, i) => (
              <View key={`b-label-${i}`} style={[styles.bucketLabel, { width: innerWidth / buckets }]}>
                <Text
                  style={[
                    styles.bucketText,
                    { color: lastBucket?.idx === i ? "#FFFFFF" : accentInk },
                  ]}
                >
                  {scoreTable[i]}
                </Text>
              </View>
            ))}
          </View>

          {/* Continuously animated puck — drives translateX/Y via Animated.Value. */}
          {activePath && activePath.xs.length > 1 ? (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.puck,
                {
                  borderColor: accent,
                  transform: [
                    {
                      translateX: dropProgress.interpolate({
                        inputRange: activePath.xs.map((_, i) => i / (activePath.xs.length - 1)),
                        outputRange: activePath.xs.map((x) => x - 10),
                      }),
                    },
                    {
                      translateY: dropProgress.interpolate({
                        inputRange: activePath.ys.map((_, i) => i / (activePath.ys.length - 1)),
                        outputRange: activePath.ys.map((y) => y - 10),
                      }),
                    },
                  ],
                },
              ]}
            />
          ) : null}
        </View>

        <View style={styles.controlRow}>
          <GameActionButton
            label="Left"
            icon="chevron-back"
            onPress={() => moveSelector(-1)}
            disabled={dropping}
            tone="secondary"
            accent={accent}
            accentInk={accentInk}
          />
          <GameActionButton
            label={dropping ? "Dropping…" : "DROP"}
            icon="arrow-down"
            onPress={dropBall}
            disabled={dropping || noBallsLeft || targetReached}
            tone="primary"
            accent={accent}
            accentInk={accentInk}
            flex={1.3}
          />
          <GameActionButton
            label="Right"
            icon="chevron-forward"
            onPress={() => moveSelector(1)}
            disabled={dropping}
            tone="secondary"
            accent={accent}
            accentInk={accentInk}
          />
        </View>
      </View>
    </InAppGameShell>
  );
}

const PlinkoGame = createGameRoute<PlinkoModeId>({
  gameId: "plinko",
  modeOptions: MODE_OPTIONS,
  GameplayScreen: PlinkoGameplay,
});

export default PlinkoGame;

const styles = StyleSheet.create({
  body: {
    flex: 1,
    gap: 12,
  },
  boardFrame: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: V2.hairline,
    backgroundColor: "rgba(255,255,255,0.6)",
    overflow: "hidden",
  },
  bucketRow: {
    position: "absolute",
    bottom: 0,
    flexDirection: "row",
  },
  puck: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 3,
  },
  bucketLabel: {
    alignItems: "center",
    justifyContent: "center",
  },
  bucketText: {
    ...typography.bold,
    fontSize: 12,
    fontVariant: ["tabular-nums"],
  },
  controlRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 10,
  },
});
