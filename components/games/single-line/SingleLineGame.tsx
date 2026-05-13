import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line } from "react-native-svg";

import { V2 } from "../../../constants/glassPalette";
import { typography } from "../../../constants/typography";
import { useGameProgress } from "../../../services/gameProgress";
import {
  createGameRoute,
  type GameModeOption,
  type GameplayScreenProps,
} from "../createGameRoute";
import { InAppGameShell, type SecondaryAction } from "../_template/InAppGameShell";

const GAME_ID = "single-line";

const TUTORIAL_BULLETS = [
  "Tap a dot to start, then tap a connected neighbour to draw an edge.",
  "Use every line exactly once — undo if you walk into a dead end.",
  "Some levels force a starting dot — the highlighted node is the only valid start.",
];

type SingleLineModeId = "easy" | "medium" | "hard";

const MODE_OPTIONS: ReadonlyArray<GameModeOption<SingleLineModeId>> = [
  { id: "easy", label: "Easy", description: "4–6 nodes, gentle shapes." },
  { id: "medium", label: "Medium", description: "7–10 nodes, some crossings." },
  { id: "hard", label: "Hard", description: "Tight graphs with required starts." },
];

// Coordinates are normalized 0..1 inside the board square.
type LevelDef = {
  nodes: { x: number; y: number }[];
  edges: [number, number][];
  // Optional: must start from this node. Otherwise any node with the right parity works.
  forcedStart?: number;
};

const LEVELS: Record<SingleLineModeId, LevelDef[]> = {
  easy: [
    {
      // Triangle.
      nodes: [
        { x: 0.5, y: 0.2 },
        { x: 0.2, y: 0.75 },
        { x: 0.8, y: 0.75 },
      ],
      edges: [
        [0, 1],
        [1, 2],
        [2, 0],
      ],
    },
    {
      // Square + diagonal.
      nodes: [
        { x: 0.2, y: 0.2 },
        { x: 0.8, y: 0.2 },
        { x: 0.8, y: 0.8 },
        { x: 0.2, y: 0.8 },
      ],
      edges: [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 0],
        [0, 2],
      ],
      forcedStart: 1,
    },
    {
      // Bowtie.
      nodes: [
        { x: 0.18, y: 0.22 },
        { x: 0.82, y: 0.22 },
        { x: 0.5, y: 0.5 },
        { x: 0.18, y: 0.78 },
        { x: 0.82, y: 0.78 },
      ],
      edges: [
        [0, 1],
        [0, 2],
        [1, 2],
        [3, 4],
        [3, 2],
        [4, 2],
      ],
    },
  ],
  medium: [
    {
      // Pentagram-ish.
      nodes: [
        { x: 0.5, y: 0.1 },
        { x: 0.92, y: 0.4 },
        { x: 0.76, y: 0.9 },
        { x: 0.24, y: 0.9 },
        { x: 0.08, y: 0.4 },
      ],
      edges: [
        [0, 2],
        [2, 4],
        [4, 1],
        [1, 3],
        [3, 0],
      ],
    },
    {
      // Two triangles sharing an edge.
      nodes: [
        { x: 0.2, y: 0.3 },
        { x: 0.5, y: 0.15 },
        { x: 0.8, y: 0.3 },
        { x: 0.5, y: 0.55 },
        { x: 0.2, y: 0.85 },
        { x: 0.8, y: 0.85 },
      ],
      edges: [
        [0, 1],
        [1, 2],
        [0, 3],
        [2, 3],
        [3, 4],
        [3, 5],
        [4, 5],
      ],
    },
    {
      // House shape.
      nodes: [
        { x: 0.5, y: 0.12 },
        { x: 0.15, y: 0.4 },
        { x: 0.85, y: 0.4 },
        { x: 0.15, y: 0.85 },
        { x: 0.85, y: 0.85 },
      ],
      edges: [
        [0, 1],
        [0, 2],
        [1, 2],
        [1, 3],
        [2, 4],
        [3, 4],
      ],
      forcedStart: 3,
    },
  ],
  hard: [
    {
      // 3x2 lattice with diagonals.
      nodes: [
        { x: 0.18, y: 0.22 },
        { x: 0.5, y: 0.22 },
        { x: 0.82, y: 0.22 },
        { x: 0.18, y: 0.78 },
        { x: 0.5, y: 0.78 },
        { x: 0.82, y: 0.78 },
      ],
      edges: [
        [0, 1],
        [1, 2],
        [0, 3],
        [1, 4],
        [2, 5],
        [3, 4],
        [4, 5],
        [0, 4],
        [2, 4],
      ],
      forcedStart: 0,
    },
    {
      // Hex.
      nodes: [
        { x: 0.5, y: 0.08 },
        { x: 0.9, y: 0.3 },
        { x: 0.9, y: 0.7 },
        { x: 0.5, y: 0.92 },
        { x: 0.1, y: 0.7 },
        { x: 0.1, y: 0.3 },
        { x: 0.5, y: 0.5 },
      ],
      edges: [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 4],
        [4, 5],
        [5, 0],
        [0, 6],
        [2, 6],
        [4, 6],
      ],
    },
    {
      // Twisted ladder.
      nodes: [
        { x: 0.15, y: 0.15 },
        { x: 0.5, y: 0.15 },
        { x: 0.85, y: 0.15 },
        { x: 0.15, y: 0.55 },
        { x: 0.5, y: 0.55 },
        { x: 0.85, y: 0.55 },
        { x: 0.15, y: 0.92 },
        { x: 0.5, y: 0.92 },
        { x: 0.85, y: 0.92 },
      ],
      edges: [
        [0, 1],
        [1, 2],
        [0, 3],
        [1, 4],
        [2, 5],
        [3, 4],
        [4, 5],
        [3, 6],
        [4, 7],
        [5, 8],
        [6, 7],
        [7, 8],
        [0, 4],
        [4, 8],
      ],
      forcedStart: 6,
    },
  ],
};

function edgeKey(a: number, b: number) {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

function SingleLineGameplay({
  title,
  modeId,
  modeLabel,
  accent,
  accentSoft,
  accentInk,
  onQuit,
  onFinish,
}: GameplayScreenProps<SingleLineModeId>) {
  const levelsForMode = LEVELS[modeId];
  const { progress, merge, markTutorialSeen } = useGameProgress(GAME_ID);

  const [levelIdx, setLevelIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [paused, setPaused] = useState(false);
  const [current, setCurrent] = useState<number | null>(null);
  const [usedEdges, setUsedEdges] = useState<string[]>([]); // ordered stack for undo
  const [boardSize, setBoardSize] = useState(0);

  const level = levelsForMode[levelIdx % levelsForMode.length];
  const totalEdges = level.edges.length;
  const isComplete = usedEdges.length === totalEdges && totalEdges > 0;

  // Adjacency for quick lookup.
  const adj = useMemo(() => {
    const map = new Map<number, number[]>();
    for (let i = 0; i < level.nodes.length; i++) map.set(i, []);
    for (const [a, b] of level.edges) {
      map.get(a)!.push(b);
      map.get(b)!.push(a);
    }
    return map;
  }, [level]);

  const resetLevel = useCallback(() => {
    setCurrent(level.forcedStart ?? null);
    setUsedEdges([]);
  }, [level]);

  useEffect(() => {
    resetLevel();
  }, [resetLevel]);

  useEffect(() => {
    setLevelIdx(0);
    setScore(0);
  }, [modeId]);

  useEffect(() => {
    if (progress && score > progress.bestScore) merge({ bestScore: score });
  }, [score, progress, merge]);

  useEffect(() => {
    if (progress) merge({ lastLevel: levelIdx + 1 });
  }, [levelIdx, progress, merge]);

  const tapNode = useCallback(
    (nodeIdx: number) => {
      if (isComplete) return;
      if (current === null) {
        // Choose a start.
        if (level.forcedStart !== undefined && nodeIdx !== level.forcedStart) return;
        setCurrent(nodeIdx);
        return;
      }
      if (nodeIdx === current) return;
      const neighbours = adj.get(current) ?? [];
      if (!neighbours.includes(nodeIdx)) return;
      const key = edgeKey(current, nodeIdx);
      if (usedEdges.includes(key)) return;
      setUsedEdges((items) => [...items, key]);
      setCurrent(nodeIdx);
    },
    [current, isComplete, adj, level.forcedStart, usedEdges],
  );

  const undo = useCallback(() => {
    if (usedEdges.length === 0 || current === null) return;
    const last = usedEdges[usedEdges.length - 1];
    const [a, b] = last.split("-").map((s) => parseInt(s, 10));
    const previous = current === a ? b : a;
    setUsedEdges((items) => items.slice(0, -1));
    setCurrent(previous);
  }, [usedEdges, current]);

  const hudPills = useMemo(
    () => [
      { label: "Level", value: String(levelIdx + 1) },
      { label: "Edges", value: `${usedEdges.length}/${totalEdges}` },
      { label: "Score", value: String(score) },
    ],
    [levelIdx, usedEdges.length, totalEdges, score],
  );

  const continueToNextLevel = useCallback(() => {
    setScore((value) => value + 50 + totalEdges * 6);
    setLevelIdx((value) => (value + 1) % levelsForMode.length);
  }, [totalEdges, levelsForMode.length]);

  const claimAndExit = useCallback(() => {
    onFinish(score + (isComplete ? totalEdges * 6 : 0));
  }, [onFinish, score, isComplete, totalEdges]);

  const secondaryActions: SecondaryAction[] = useMemo(
    () => [
      { label: "Undo", icon: "arrow-undo", onPress: undo, disabled: usedEdges.length === 0 },
      { label: "Restart", icon: "refresh", onPress: resetLevel },
    ],
    [undo, resetLevel, usedEdges.length],
  );

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setBoardSize(Math.min(width, height));
  };

  return (
    <InAppGameShell
      title={title}
      subtitle={`${modeLabel} · Level ${levelIdx + 1}`}
      accent={accent}
      accentSoft={accentSoft}
      accentInk={accentInk}
      hudPills={hudPills}
      levelComplete={
        isComplete
          ? {
              title: `Level ${levelIdx + 1} solved`,
              subtitle: `Every edge used once. Next graph has ${
                levelsForMode[(levelIdx + 1) % levelsForMode.length].edges.length
              } edges.`,
            }
          : null
      }
      onQuit={onQuit}
      onPause={() => setPaused(true)}
      paused={paused}
      onResume={() => setPaused(false)}
      onRestartLevel={() => {
        setPaused(false);
        resetLevel();
      }}
      onClaimExit={claimAndExit}
      onNextLevel={continueToNextLevel}
      secondaryActions={secondaryActions}
      tutorial={{
        visible: progress != null && !progress.tutorialSeen,
        title: "How to play Single Line",
        bullets: TUTORIAL_BULLETS,
        onDismiss: markTutorialSeen,
      }}
    >
      <View style={styles.body}>
        <View style={styles.hintCard}>
          <Text style={styles.hintLabel}>Trace one continuous line</Text>
          <Text style={styles.hintBody}>
            Tap a starting dot, then tap a connected neighbour. Use every line exactly once. Undo if
            you walk into a dead end.
          </Text>
        </View>

        <View style={styles.boardWrap} onLayout={handleLayout}>
          {boardSize > 0 ? (
            <View
              style={[
                styles.boardFrame,
                { width: boardSize, height: boardSize, borderColor: `${accentInk}33` },
              ]}
            >
              <Svg width={boardSize} height={boardSize}>
                {level.edges.map(([a, b], idx) => {
                  const key = edgeKey(a, b);
                  const used = usedEdges.includes(key);
                  const na = level.nodes[a];
                  const nb = level.nodes[b];
                  return (
                    <Line
                      key={`${key}-${idx}`}
                      x1={na.x * boardSize}
                      y1={na.y * boardSize}
                      x2={nb.x * boardSize}
                      y2={nb.y * boardSize}
                      stroke={used ? accent : "rgba(0,0,0,0.16)"}
                      strokeWidth={used ? 6 : 4}
                      strokeLinecap="round"
                    />
                  );
                })}
                {level.nodes.map((node, idx) => {
                  const isCurrent = current === idx;
                  const isStart =
                    level.forcedStart === idx ||
                    (level.forcedStart === undefined && current === null);
                  return (
                    <Circle
                      key={`node-${idx}`}
                      cx={node.x * boardSize}
                      cy={node.y * boardSize}
                      r={isCurrent ? 14 : 11}
                      fill={isCurrent ? accent : "#FFFFFF"}
                      stroke={isCurrent ? accentInk : isStart ? accent : V2.hairlineStrong}
                      strokeWidth={isCurrent ? 3 : 2}
                    />
                  );
                })}
              </Svg>

              {level.nodes.map((node, idx) => (
                <Pressable
                  key={`tap-${idx}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Node ${idx + 1}`}
                  onPress={() => tapNode(idx)}
                  hitSlop={10}
                  style={[
                    styles.nodeHit,
                    {
                      left: node.x * boardSize - 22,
                      top: node.y * boardSize - 22,
                    },
                  ]}
                />
              ))}

              {/* Soft pulse ring around the current node. */}
              {current !== null ? (
                <MotiView
                  key={`pulse-${current}-${usedEdges.length}`}
                  from={{ opacity: 0.55, scale: 0.4 }}
                  animate={{ opacity: 0, scale: 1.8 }}
                  transition={{ type: "timing", duration: 700, loop: true, repeatReverse: false }}
                  pointerEvents="none"
                  style={[
                    styles.pulseRing,
                    {
                      borderColor: accent,
                      left: level.nodes[current].x * boardSize - 18,
                      top: level.nodes[current].y * boardSize - 18,
                    },
                  ]}
                />
              ) : null}
            </View>
          ) : null}
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.statusText}>
            {current === null
              ? level.forcedStart !== undefined
                ? "Tap the highlighted start dot"
                : "Tap any dot to begin"
              : isComplete
                ? "All edges traced — claim or continue"
                : `${totalEdges - usedEdges.length} edge${totalEdges - usedEdges.length === 1 ? "" : "s"} left`}
          </Text>
        </View>
      </View>
    </InAppGameShell>
  );
}

const SingleLineGame = createGameRoute<SingleLineModeId>({
  gameId: "single-line",
  modeOptions: MODE_OPTIONS,
  GameplayScreen: SingleLineGameplay,
});

export default SingleLineGame;

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
    minHeight: 280,
  },
  boardFrame: {
    borderRadius: 22,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.78)",
    overflow: "hidden",
  },
  nodeHit: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  pulseRing: {
    position: "absolute",
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
  },
  statusRow: {
    alignItems: "center",
    paddingVertical: 6,
  },
  statusText: {
    ...typography.bold,
    fontSize: 12,
    letterSpacing: 0.4,
    color: V2.muted,
    textTransform: "uppercase",
  },
});
