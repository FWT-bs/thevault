import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LayoutChangeEvent, StyleSheet, Text, View } from "react-native";
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
  "Aim with Left / Right, then tap DROP — balls bounce off the pegs.",
  "Center slot is the jackpot. Edges only pay a sliver.",
  "You can fire-drop: queue another ball before the last one settles.",
];

type PlinkoModeId = "casual" | "ranked" | "expert";

const MODE_OPTIONS: ReadonlyArray<GameModeOption<PlinkoModeId>> = [
  { id: "casual", label: "Casual", description: "6 balls per level, gentle ramp." },
  { id: "ranked", label: "Ranked", description: "5 balls, higher targets each level." },
  { id: "expert", label: "Expert", description: "3 balls, dense pegs from the start." },
];

type LevelDef = { balls: number; target: number; pegRows: number };

const LEVELS: Record<PlinkoModeId, LevelDef[]> = {
  casual: [
    { balls: 6, target: 250, pegRows: 6 },
    { balls: 6, target: 400, pegRows: 7 },
    { balls: 5, target: 550, pegRows: 7 },
    { balls: 5, target: 750, pegRows: 8 },
    { balls: 4, target: 950, pegRows: 8 },
  ],
  ranked: [
    { balls: 5, target: 350, pegRows: 7 },
    { balls: 5, target: 600, pegRows: 8 },
    { balls: 4, target: 800, pegRows: 8 },
    { balls: 4, target: 1100, pegRows: 9 },
    { balls: 3, target: 1300, pegRows: 9 },
  ],
  expert: [
    { balls: 3, target: 500, pegRows: 8 },
    { balls: 3, target: 800, pegRows: 9 },
    { balls: 3, target: 1200, pegRows: 9 },
    { balls: 2, target: 1500, pegRows: 10 },
  ],
};

// Triangular peg field: row r has TOP_ROW_COUNT + r pegs (matches the
// PlinkoPegField.cs layout). Bottom row width = (TOP_ROW_COUNT + rows - 1).
const TOP_ROW_COUNT = 3;

// Score table: V-shape with a single jackpot in the center (Unity slot
// flavor — see PlinkoSlot.cs, where each slot carries its own Points).
function bucketScores(slots: number): number[] {
  const center = (slots - 1) / 2;
  return Array.from({ length: slots }, (_, i) => {
    const normalized = Math.abs(i - center) / Math.max(center, 1);
    if (normalized < 0.08) return 500; // jackpot
    if (normalized < 0.28) return 250;
    if (normalized < 0.5) return 100;
    if (normalized < 0.72) return 50;
    if (normalized < 0.9) return 25;
    return 10;
  });
}

// Physics tuning. These map roughly to the Unity Rigidbody2D defaults in
// PlinkoBall.cs (gravity 1, mass 0.2, restitution 0.4, drag 0.05).
const GRAVITY_PX_PER_S2 = 1300;
const RESTITUTION = 0.5;
const WALL_RESTITUTION = 0.6;
const DRAG = 0.06;
const BALL_RADIUS = 7;
const PEG_RADIUS = 4.2;
const SPAWN_JITTER_PX = 6; // matches PlinkoController._ballSpawnJitterX
const SETTLED_DESPAWN_MS = 700;
const MAX_LIFETIME_MS = 8000; // PlinkoBall.MaxLifetimeSeconds = 8

type Vec = { x: number; y: number };
type Peg = Vec & { r: number };
type Ball = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  settled: boolean;
  bucketIdx: number | null;
  bornAt: number;
};

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
  const [boardSize, setBoardSize] = useState({ width: 0, height: 0 });
  const [lastBucket, setLastBucket] = useState<{ idx: number; value: number } | null>(null);

  const level = levelsForMode[levelIdx % levelsForMode.length];
  const slots = TOP_ROW_COUNT + level.pegRows - 1;
  const scoreTable = useMemo(() => bucketScores(slots), [slots]);
  const targetReached = score >= level.target;
  const noBallsLeft = ballsLeft <= 0;

  // Aim column index, 0..(slots-1). Dropped balls spawn above this slot.
  const [aimCol, setAimCol] = useState(Math.floor(slots / 2));

  // Layout math (selector lane on top, peg field in middle, bucket band
  // on the bottom). Mirrors the PlinkoRoot scene from the Unity README.
  const innerWidth = boardSize.width;
  const innerHeight = boardSize.height;
  const selectorH = 40;
  const bucketH = 44;
  const playH = Math.max(innerHeight - selectorH - bucketH - 8, 0);
  const pegRows = level.pegRows;
  const slotW = innerWidth > 0 ? innerWidth / slots : 0;
  const colSpacing = slotW;
  const rowSpacing = pegRows > 0 ? playH / (pegRows + 1) : 0;
  const playTop = selectorH;
  const floorY = innerHeight - bucketH;

  // Pegs as a memoized array — geometry only, never mutated by the loop.
  const pegs = useMemo<Peg[]>(() => {
    if (innerWidth <= 0 || playH <= 0) return [];
    const out: Peg[] = [];
    for (let r = 0; r < pegRows; r++) {
      const pegsInRow = TOP_ROW_COUNT + r;
      const rowWidth = (pegsInRow - 1) * colSpacing;
      const y = playTop + rowSpacing * (r + 1);
      const xStart = (innerWidth - rowWidth) / 2;
      for (let c = 0; c < pegsInRow; c++) {
        out.push({ x: xStart + c * colSpacing, y, r: PEG_RADIUS });
      }
    }
    return out;
  }, [innerWidth, playH, pegRows, colSpacing, rowSpacing, playTop]);

  // Aim column → world X for the spawn point.
  const colX = useCallback(
    (col: number) => slotW * col + slotW / 2,
    [slotW],
  );

  // Mutable physics state lives in refs so the rAF loop can mutate it
  // without forcing React reconciles per ball update.
  const ballsRef = useRef<Ball[]>([]);
  const ballIdRef = useRef(0);
  const playingRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const [, forceTick] = useState(0);

  const stopLoop = useCallback(() => {
    playingRef.current = false;
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const settleBall = useCallback(
    (ball: Ball) => {
      if (ball.settled) return;
      ball.settled = true;
      ball.vx = 0;
      ball.vy = 0;
      const idx = Math.max(0, Math.min(slots - 1, Math.floor(ball.x / slotW)));
      ball.bucketIdx = idx;
      const value = scoreTable[idx] ?? 0;
      setScore((s) => s + value);
      setLastBucket({ idx, value });
      // Despawn after a brief pause so the player can see where it landed.
      setTimeout(() => {
        ballsRef.current = ballsRef.current.filter((b) => b.id !== ball.id);
        forceTick((t) => t + 1);
      }, SETTLED_DESPAWN_MS);
    },
    [scoreTable, slots, slotW],
  );

  const step = useCallback(
    (dt: number) => {
      const balls = ballsRef.current;
      const now = performance.now();
      for (const b of balls) {
        if (b.settled) continue;
        // Kill clipped balls (PlinkoBall.MaxLifetimeSeconds equivalent).
        if (now - b.bornAt > MAX_LIFETIME_MS) {
          settleBall(b);
          continue;
        }
        // Gravity + drag.
        b.vy += GRAVITY_PX_PER_S2 * dt;
        b.vx *= 1 - DRAG * dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;

        // Peg collisions — circle vs circle, separating + reflecting along
        // the contact normal. Tiny horizontal jitter prevents the ball
        // from balancing perfectly on a peg apex.
        for (const p of pegs) {
          const dx = b.x - p.x;
          const dy = b.y - p.y;
          const min = p.r + b.r;
          const distSq = dx * dx + dy * dy;
          if (distSq >= min * min || distSq <= 0.0001) continue;
          const dist = Math.sqrt(distSq);
          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = min - dist;
          b.x += nx * overlap;
          b.y += ny * overlap;
          const vDotN = b.vx * nx + b.vy * ny;
          if (vDotN < 0) {
            b.vx -= (1 + RESTITUTION) * vDotN * nx;
            b.vy -= (1 + RESTITUTION) * vDotN * ny;
            b.vx += (Math.random() - 0.5) * 30;
          }
        }

        // Walls — left/right are static colliders, matching the Unity scene.
        if (b.x < b.r) {
          b.x = b.r;
          b.vx = -b.vx * WALL_RESTITUTION;
        } else if (b.x > innerWidth - b.r) {
          b.x = innerWidth - b.r;
          b.vx = -b.vx * WALL_RESTITUTION;
        }

        // Floor → land in a slot.
        if (b.y + b.r >= floorY) {
          b.y = floorY - b.r;
          settleBall(b);
        }
      }
    },
    [pegs, innerWidth, floorY, settleBall],
  );

  const ensureLoop = useCallback(() => {
    if (playingRef.current) return;
    playingRef.current = true;
    let last = performance.now();
    const loop = (now: number) => {
      if (!playingRef.current) return;
      const dt = Math.min((now - last) / 1000, 0.033);
      last = now;
      step(dt);
      forceTick((t) => t + 1);
      const stillRunning = ballsRef.current.some((b) => !b.settled);
      if (stillRunning) {
        rafRef.current = requestAnimationFrame(loop);
      } else {
        playingRef.current = false;
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(loop);
  }, [step]);

  // Pause integration: when the shell pauses, freeze the loop. We resume
  // on demand below.
  useEffect(() => {
    if (paused) stopLoop();
    else if (ballsRef.current.some((b) => !b.settled)) ensureLoop();
  }, [paused, ensureLoop, stopLoop]);

  // Stop loop and clear balls on unmount or level change.
  useEffect(() => () => stopLoop(), [stopLoop]);

  // Reset per-level state.
  useEffect(() => {
    stopLoop();
    ballsRef.current = [];
    setBallsLeft(level.balls);
    setScore(0);
    setAimCol(Math.floor(slots / 2));
    setLastBucket(null);
    forceTick((t) => t + 1);
  }, [levelIdx, level.balls, slots, stopLoop]);

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

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setBoardSize({ width, height });
  };

  const dropBall = useCallback(() => {
    if (noBallsLeft || targetReached || paused) return;
    if (innerWidth <= 0 || innerHeight <= 0) return;
    const jitter = (Math.random() - 0.5) * 2 * SPAWN_JITTER_PX;
    const x = Math.max(BALL_RADIUS, Math.min(innerWidth - BALL_RADIUS, colX(aimCol) + jitter));
    const ball: Ball = {
      id: ++ballIdRef.current,
      x,
      y: selectorH + BALL_RADIUS + 2,
      vx: (Math.random() - 0.5) * 30,
      vy: 0,
      r: BALL_RADIUS,
      settled: false,
      bucketIdx: null,
      bornAt: performance.now(),
    };
    ballsRef.current = [...ballsRef.current, ball];
    setBallsLeft((n) => n - 1);
    ensureLoop();
    forceTick((t) => t + 1);
  }, [noBallsLeft, targetReached, paused, innerWidth, innerHeight, colX, aimCol, ensureLoop]);

  const moveSelector = useCallback(
    (delta: number) => {
      setAimCol((c) => Math.max(0, Math.min(slots - 1, c + delta)));
    },
    [slots],
  );

  const restartLevel = useCallback(() => {
    stopLoop();
    ballsRef.current = [];
    setBallsLeft(level.balls);
    setScore(0);
    setAimCol(Math.floor(slots / 2));
    setLastBucket(null);
    forceTick((t) => t + 1);
  }, [level.balls, slots, stopLoop]);

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
    () => [{ label: "Restart", icon: "refresh", onPress: restartLevel }],
    [restartLevel],
  );

  const balls = ballsRef.current;

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
          : noBallsLeft && balls.every((b) => b.settled)
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
                cx={colX(aimCol)}
                cy={selectorH / 2}
                r={12}
                fill={accent}
                stroke={accentInk}
                strokeWidth={2}
              />

              {/* Triangular peg grid */}
              {pegs.map((p, i) => (
                <Circle
                  key={`peg-${i}`}
                  cx={p.x}
                  cy={p.y}
                  r={p.r}
                  fill={accentInk}
                  opacity={0.85}
                />
              ))}

              {/* Slots — Unity-style multipliers, jackpot in the center */}
              {Array.from({ length: slots }).map((_, i) => {
                const x = i * slotW;
                const isHit = lastBucket?.idx === i;
                const value = scoreTable[i];
                const isJackpot = value >= 500;
                const fill = isHit
                  ? accent
                  : isJackpot
                    ? "rgba(255,215,0,0.18)"
                    : i % 2 === 0
                      ? "rgba(0,0,0,0.05)"
                      : "rgba(0,0,0,0.08)";
                return (
                  <Rect
                    key={`bucket-${i}`}
                    x={x + 2}
                    y={floorY + 2}
                    width={slotW - 4}
                    height={bucketH - 4}
                    rx={8}
                    fill={fill}
                    stroke={isJackpot ? "#D4A017" : accentInk}
                    strokeOpacity={isJackpot ? 0.6 : 0.18}
                  />
                );
              })}

              {/* Live balls */}
              {balls.map((b) => (
                <Circle
                  key={`ball-${b.id}`}
                  cx={b.x}
                  cy={b.y}
                  r={b.r}
                  fill="#FFFFFF"
                  stroke={accent}
                  strokeWidth={3}
                />
              ))}
            </Svg>
          ) : null}

          {/* Slot labels rendered as RN Text so they stay legible at any DPI. */}
          <View style={[styles.bucketRow, { width: innerWidth, height: bucketH, top: floorY }]}>
            {Array.from({ length: slots }).map((_, i) => {
              const value = scoreTable[i];
              const isHit = lastBucket?.idx === i;
              const isJackpot = value >= 500;
              return (
                <View key={`b-label-${i}`} style={[styles.bucketLabel, { width: slotW }]}>
                  <Text
                    style={[
                      styles.bucketText,
                      isJackpot && styles.bucketJackpot,
                      { color: isHit ? "#FFFFFF" : isJackpot ? "#8A6500" : accentInk },
                    ]}
                  >
                    {value}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.controlRow}>
          <GameActionButton
            label="Left"
            icon="chevron-back"
            onPress={() => moveSelector(-1)}
            disabled={paused}
            tone="secondary"
            accent={accent}
            accentInk={accentInk}
          />
          <GameActionButton
            label="DROP"
            icon="arrow-down"
            onPress={dropBall}
            disabled={noBallsLeft || targetReached || paused}
            tone="primary"
            accent={accent}
            accentInk={accentInk}
            flex={1.3}
          />
          <GameActionButton
            label="Right"
            icon="chevron-forward"
            onPress={() => moveSelector(1)}
            disabled={paused}
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
  body: { flex: 1, gap: 12 },
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
    left: 0,
    flexDirection: "row",
  },
  bucketLabel: {
    alignItems: "center",
    justifyContent: "center",
  },
  bucketText: {
    ...typography.bold,
    fontSize: 13,
    fontVariant: ["tabular-nums"],
  },
  bucketJackpot: {
    fontSize: 14,
    letterSpacing: 0.4,
  },
  controlRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 10,
  },
});
