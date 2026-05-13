import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { V2 } from "../../../constants/glassPalette";
import { typography } from "../../../constants/typography";
import {
  createGameRoute,
  type GameModeOption,
  type GameplayScreenProps,
} from "../createGameRoute";
import { InAppGameShell, type SecondaryAction } from "../_template/InAppGameShell";

type BricksVsBallsModeId = "classic" | "challenge" | "expert";

const MODE_OPTIONS: ReadonlyArray<GameModeOption<BricksVsBallsModeId>> = [
  {
    id: "classic",
    label: "Classic",
    description: "5 lanes, 4 rows — generous ball count.",
  },
  {
    id: "challenge",
    label: "Challenge",
    description: "6 lanes, 5 rows — bricks hit harder.",
  },
  {
    id: "expert",
    label: "Expert",
    description: "6 lanes, 5 rows, fewer balls — precision matters.",
  },
];

type ModeConfig = {
  lanes: number;
  rows: number;
  startBalls: number;
};

const MODE_CONFIG: Record<BricksVsBallsModeId, ModeConfig> = {
  classic: { lanes: 5, rows: 4, startBalls: 9 },
  challenge: { lanes: 6, rows: 5, startBalls: 8 },
  expert: { lanes: 6, rows: 5, startBalls: 6 },
};

function buildBricks(level: number, lanes: number, rows: number): number[] {
  return Array.from({ length: rows * lanes }, (_, index) => {
    const row = Math.floor(index / lanes);
    const noise = (index * 17 + level * 11 + row * 7) % 5;
    const base = 1 + ((index + row + level) % 3);
    const include = noise < 4;
    return include ? base + Math.floor(level / 2) : 0;
  });
}

function ballsForLevel(start: number, level: number) {
  return start + (level - 1) * 2;
}

function BricksVsBallsGameplay({
  title,
  modeId,
  modeLabel,
  accent,
  accentSoft,
  accentInk,
  onQuit,
  onFinish,
}: GameplayScreenProps<BricksVsBallsModeId>) {
  const cfg = MODE_CONFIG[modeId];

  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [paused, setPaused] = useState(false);
  const [ballsRemaining, setBallsRemaining] = useState(() => ballsForLevel(cfg.startBalls, 1));
  const [bricks, setBricks] = useState<number[]>(() => buildBricks(1, cfg.lanes, cfg.rows));

  useEffect(() => {
    setLevel(1);
    setScore(0);
    setBallsRemaining(ballsForLevel(cfg.startBalls, 1));
    setBricks(buildBricks(1, cfg.lanes, cfg.rows));
  }, [cfg.lanes, cfg.rows, cfg.startBalls]);

  const remaining = useMemo(() => bricks.filter((v) => v > 0).length, [bricks]);
  const wallCleared = remaining === 0;
  const outOfBalls = ballsRemaining <= 0 && !wallCleared;

  const launchAtLane = useCallback(
    (lane: number) => {
      if (wallCleared || ballsRemaining <= 0) return;
      setBricks((current) => {
        const next = [...current];
        let damageLeft = 1 + Math.floor(level / 2);
        for (let row = cfg.rows - 1; row >= 0 && damageLeft > 0; row -= 1) {
          const idx = row * cfg.lanes + lane;
          if (next[idx] > 0) {
            const take = Math.min(next[idx], damageLeft);
            next[idx] -= take;
            damageLeft -= take;
            setScore((value) => value + take * (10 + level));
          }
        }
        return next;
      });
      setBallsRemaining((value) => Math.max(0, value - 1));
    },
    [ballsRemaining, cfg.lanes, cfg.rows, level, wallCleared],
  );

  const restartLevel = useCallback(() => {
    setBricks(buildBricks(level, cfg.lanes, cfg.rows));
    setBallsRemaining(ballsForLevel(cfg.startBalls, level));
  }, [cfg.lanes, cfg.rows, cfg.startBalls, level]);

  const continueToNextLevel = useCallback(() => {
    const next = level + 1;
    setScore((value) => value + 80 + level * 20);
    setLevel(next);
    setBricks(buildBricks(next, cfg.lanes, cfg.rows));
    setBallsRemaining(ballsForLevel(cfg.startBalls, next));
  }, [cfg.lanes, cfg.rows, cfg.startBalls, level]);

  const claimAndExit = useCallback(() => {
    onFinish(score);
  }, [onFinish, score]);

  const hudPills = useMemo(
    () => [
      { label: "Score", value: String(score) },
      { label: "Level", value: String(level) },
      { label: "Balls", value: String(ballsRemaining) },
    ],
    [score, level, ballsRemaining],
  );

  const secondaryActions: SecondaryAction[] = useMemo(
    () => [
      {
        label: outOfBalls ? "Reload wall" : "Restart",
        icon: "refresh",
        onPress: restartLevel,
      },
    ],
    [outOfBalls, restartLevel],
  );

  return (
    <InAppGameShell
      title={title}
      subtitle={`${modeLabel} · Level ${level}`}
      accent={accent}
      accentSoft={accentSoft}
      accentInk={accentInk}
      hudPills={hudPills}
      levelComplete={
        wallCleared
          ? {
              title: `Wall cleared · level ${level}`,
              subtitle: `Score ${score} · Next wall: level ${level + 1} (+2 balls)`,
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
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Bricks remaining</Text>
            <Text style={[styles.statusValue, { color: accentInk }]}>
              {remaining}
            </Text>
          </View>
          {outOfBalls ? (
            <Text style={[styles.statusHint, { color: V2.red }]}>
              No balls left — tap Reload wall to retry the volley.
            </Text>
          ) : (
            <Text style={styles.statusHint}>
              Aim a lane to launch every remaining shot at the bottom-most brick.
            </Text>
          )}
        </View>

        <View style={styles.brickBoardWrap}>
          <View style={[styles.brickBoard, { borderColor: accentInk + "33" }]}>
            {bricks.map((value, idx) => {
              const empty = value === 0;
              const heat = Math.min(1, value / (3 + Math.floor(level / 2)));
              return (
                <View
                  key={idx}
                  style={[
                    styles.brick,
                    { width: `${100 / cfg.lanes - 1.5}%` },
                    empty
                      ? styles.brickEmpty
                      : {
                          backgroundColor: heat > 0.7 ? accent : `${accent}cc`,
                          borderColor: accentInk,
                        },
                  ]}
                >
                  {!empty ? <Text style={styles.brickText}>{value}</Text> : null}
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.laneRow}>
          {Array.from({ length: cfg.lanes }).map((_, lane) => (
            <Pressable
              key={lane}
              accessibilityRole="button"
              accessibilityLabel={`Aim lane ${lane + 1}`}
              onPress={() => launchAtLane(lane)}
              disabled={wallCleared || ballsRemaining <= 0}
              style={({ pressed }) => [
                styles.laneButton,
                { width: `${100 / cfg.lanes - 1.5}%`, borderColor: accentInk },
                (wallCleared || ballsRemaining <= 0) && styles.laneButtonDisabled,
                pressed && !wallCleared && ballsRemaining > 0 && styles.lanePressed,
              ]}
            >
              <Ionicons name="rocket" size={14} color={accentInk} />
              <Text style={[styles.laneText, { color: accentInk }]}>{lane + 1}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </InAppGameShell>
  );
}

const BricksVsBallsGame = createGameRoute<BricksVsBallsModeId>({
  gameId: "bricks-vs-balls",
  modeOptions: MODE_OPTIONS,
  GameplayScreen: BricksVsBallsGameplay,
});

export default BricksVsBallsGame;

const styles = StyleSheet.create({
  body: {
    flex: 1,
    gap: 12,
  },
  statusCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: V2.hairline,
    backgroundColor: "rgba(255,255,255,0.82)",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusLabel: {
    ...typography.bold,
    fontSize: 10,
    color: V2.muted,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  statusValue: {
    ...typography.bold,
    fontSize: 22,
    letterSpacing: 0,
    fontVariant: ["tabular-nums"],
  },
  statusHint: {
    ...typography.semibold,
    marginTop: 4,
    fontSize: 11,
    lineHeight: 15,
    color: V2.muted,
  },
  brickBoardWrap: {
    flex: 1,
    minHeight: 200,
  },
  brickBoard: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.65)",
    padding: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  brick: {
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  brickEmpty: {
    backgroundColor: "rgba(0,0,0,0.03)",
    borderColor: "rgba(0,0,0,0.06)",
  },
  brickText: {
    ...typography.bold,
    fontSize: 13,
    color: "#FFFFFF",
    letterSpacing: 0,
  },
  laneRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  laneButton: {
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.86)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  laneButtonDisabled: {
    opacity: 0.4,
  },
  lanePressed: {
    opacity: 0.78,
  },
  laneText: {
    ...typography.bold,
    fontSize: 13,
    letterSpacing: 0,
  },
});
