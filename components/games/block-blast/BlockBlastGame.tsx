import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { V2 } from "../../../constants/glassPalette";
import { typography } from "../../../constants/typography";
import {
  createGameRoute,
  type GameModeOption,
  type GameplayScreenProps,
} from "../createGameRoute";
import { InAppGameShell, type SecondaryAction } from "../_template/InAppGameShell";

type BlockBlastModeId = "classic" | "challenge" | "expert";

const MODE_OPTIONS: ReadonlyArray<GameModeOption<BlockBlastModeId>> = [
  {
    id: "classic",
    label: "Classic",
    description: "6×6 board with gentle density ramps each level.",
  },
  {
    id: "challenge",
    label: "Challenge",
    description: "7×7 board — bigger combos, tougher targets.",
  },
  {
    id: "expert",
    label: "Expert",
    description: "8×8 dense board. Every tap counts.",
  },
];

const MODE_GRID: Record<BlockBlastModeId, number> = {
  classic: 6,
  challenge: 7,
  expert: 8,
};

const BLOCK_COLORS = ["#0EA5E9", "#F472B6", "#FACC15", "#22C55E", "#A78BFA"];

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function buildBoard(level: number, size: number, modeSeed: number): (number | null)[] {
  const rng = mulberry32(level * 73856093 ^ size * 19349663 ^ modeSeed * 83492791);
  const density = Math.min(0.85, 0.55 + level * 0.04);
  const palette = Math.min(BLOCK_COLORS.length, 3 + Math.floor(level / 2));
  return Array.from({ length: size * size }, () =>
    rng() < density ? Math.floor(rng() * palette) : null,
  );
}

function targetForLevel(level: number, size: number) {
  return Math.min(size * size - 4, 8 + (level - 1) * 4);
}

function neighborsOf(idx: number, size: number) {
  const row = Math.floor(idx / size);
  const col = idx % size;
  const list: number[] = [];
  if (row > 0) list.push(idx - size);
  if (row < size - 1) list.push(idx + size);
  if (col > 0) list.push(idx - 1);
  if (col < size - 1) list.push(idx + 1);
  return list;
}

function findGroup(board: (number | null)[], idx: number, size: number): number[] {
  const color = board[idx];
  if (color === null) return [];
  const seen = new Set<number>([idx]);
  const queue = [idx];
  while (queue.length) {
    const current = queue.shift()!;
    for (const n of neighborsOf(current, size)) {
      if (!seen.has(n) && board[n] === color) {
        seen.add(n);
        queue.push(n);
      }
    }
  }
  return [...seen];
}

function BlockBlastGameplay({
  title,
  modeId,
  modeLabel,
  accent,
  accentSoft,
  accentInk,
  onQuit,
  onFinish,
}: GameplayScreenProps<BlockBlastModeId>) {
  const size = MODE_GRID[modeId];
  const modeSeed = modeId.length;

  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [paused, setPaused] = useState(false);
  const [popped, setPopped] = useState(0);
  const [board, setBoard] = useState<(number | null)[]>(() =>
    buildBoard(1, size, modeSeed),
  );
  const [boardWidth, setBoardWidth] = useState(0);
  const skipLevelResetRef = useRef(false);

  const target = useMemo(() => targetForLevel(level, size), [level, size]);
  const levelComplete = popped >= target;

  useEffect(() => {
    setLevel(1);
    setScore(0);
  }, [modeId]);

  useEffect(() => {
    if (skipLevelResetRef.current) {
      skipLevelResetRef.current = false;
      return;
    }
    setBoard(buildBoard(level, size, modeSeed));
    setPopped(0);
  }, [level, size, modeSeed]);

  const handleBoardLayout = (event: LayoutChangeEvent) => {
    setBoardWidth(event.nativeEvent.layout.width);
  };

  const tapCell = useCallback(
    (idx: number) => {
      if (levelComplete) return;
      setBoard((current) => {
        if (current[idx] === null) return current;
        const group = findGroup(current, idx, size);
        if (group.length < 2) return current;
        const next = [...current];
        for (const i of group) next[i] = null;
        const gain = group.length * (8 + level * 2) + (group.length >= 5 ? 25 : 0);
        setScore((value) => value + gain);
        setPopped((value) => value + group.length);
        return next;
      });
    },
    [levelComplete, level, size],
  );

  const restartLevel = useCallback(() => {
    setBoard(buildBoard(level + 7919, size, modeSeed));
    setPopped(0);
  }, [level, size, modeSeed]);

  const reshuffle = useCallback(() => {
    setBoard(buildBoard(level * 13 + Date.now(), size, modeSeed));
  }, [level, size, modeSeed]);

  const continueToNextLevel = useCallback(() => {
    setScore((value) => value + 60 + level * 15);
    setLevel((value) => value + 1);
  }, [level]);

  const claimAndExit = useCallback(() => {
    onFinish(score);
  }, [onFinish, score]);

  const hudPills = useMemo(
    () => [
      { label: "Score", value: String(score) },
      { label: "Level", value: String(level) },
      { label: "Target", value: `${Math.min(popped, target)}/${target}` },
    ],
    [score, level, popped, target],
  );

  const secondaryActions: SecondaryAction[] = useMemo(
    () => [
      { label: "Reshuffle", icon: "shuffle", onPress: reshuffle },
      { label: "Restart", icon: "refresh", onPress: restartLevel },
    ],
    [reshuffle, restartLevel],
  );

  const cellSize = boardWidth > 0 ? (boardWidth - (size + 1) * 4) / size : 0;

  return (
    <InAppGameShell
      title={title}
      subtitle={`${modeLabel} · Level ${level}`}
      accent={accent}
      accentSoft={accentSoft}
      accentInk={accentInk}
      hudPills={hudPills}
      levelComplete={
        levelComplete
          ? {
              title: `Level ${level} cleared`,
              subtitle: `Popped ${popped} blocks · Score ${score} · Next target: ${targetForLevel(level + 1, size)} blocks`,
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
    >
      <View style={styles.body}>
        <View style={styles.targetCard}>
          <Text style={styles.targetLabel}>Pop matching blocks</Text>
          <Text style={[styles.targetValue, { color: accentInk }]}>
            {Math.min(popped, target)}/{target}
          </Text>
          <Text style={styles.targetHint}>
            Tap groups of two or more of the same color to clear them.
          </Text>
        </View>

        <View style={styles.boardWrapper}>
          <View
            style={[styles.board, { borderColor: accentInk + "33" }]}
            onLayout={handleBoardLayout}
          >
            {board.map((value, idx) => {
              if (cellSize === 0) return null;
              const color = value === null ? null : BLOCK_COLORS[value];
              return (
                <Pressable
                  key={idx}
                  accessibilityRole="button"
                  accessibilityLabel={color ? `Block ${idx}` : `Empty cell ${idx}`}
                  onPress={() => tapCell(idx)}
                  disabled={value === null || levelComplete}
                  style={({ pressed }) => [
                    styles.cell,
                    {
                      width: cellSize,
                      height: cellSize,
                      backgroundColor: color ?? "rgba(0,0,0,0.04)",
                    },
                    pressed && color && styles.cellPressed,
                  ]}
                />
              );
            })}
          </View>
        </View>
      </View>
    </InAppGameShell>
  );
}

const BlockBlastGame = createGameRoute<BlockBlastModeId>({
  gameId: "block-blast",
  modeOptions: MODE_OPTIONS,
  GameplayScreen: BlockBlastGameplay,
});

export default BlockBlastGame;

const styles = StyleSheet.create({
  body: {
    flex: 1,
    gap: 12,
  },
  targetCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: V2.hairline,
    backgroundColor: "rgba(255,255,255,0.82)",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  targetLabel: {
    ...typography.bold,
    fontSize: 10,
    color: V2.muted,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  targetValue: {
    ...typography.bold,
    marginTop: 2,
    fontSize: 24,
    letterSpacing: 0,
    fontVariant: ["tabular-nums"],
  },
  targetHint: {
    ...typography.semibold,
    marginTop: 4,
    fontSize: 11,
    lineHeight: 15,
    color: V2.muted,
  },
  boardWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  board: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 22,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.6)",
    padding: 4,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  cell: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  cellPressed: {
    opacity: 0.72,
  },
});
