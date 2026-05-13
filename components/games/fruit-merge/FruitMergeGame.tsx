import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  GestureResponderEvent,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { V2 } from "../../../constants/glassPalette";
import { typography } from "../../../constants/typography";
import { useGameProgress } from "../../../services/gameProgress";
import {
  createGameRoute,
  type GameModeOption,
  type GameplayScreenProps,
} from "../createGameRoute";
import { GameActionButton, InAppGameShell, type SecondaryAction } from "../_template/InAppGameShell";

const GAME_ID = "fruit-merge";

const TUTORIAL_BULLETS = [
  "Tap the jar or use Left / Right to aim, then DROP to release.",
  "Same-tier fruits that touch merge into the next tier — score grows fast.",
  "Don't let any fruit linger above the red danger line or the jar overflows.",
];

type FruitMergeModeId = "easy" | "normal" | "hard";

const MODE_OPTIONS: ReadonlyArray<GameModeOption<FruitMergeModeId>> = [
  { id: "easy", label: "Easy", description: "Wide jar, only the first 3 fruit tiers spawn." },
  { id: "normal", label: "Normal", description: "Standard jar, all 5 tiers can spawn." },
  { id: "hard", label: "Hard", description: "Narrow jar with bouncier fruit." },
];

type ModeSettings = {
  spawnRange: number;
  jarRatio: number;
  bounce: number;
};

const MODE_SETTINGS: Record<FruitMergeModeId, ModeSettings> = {
  easy: { spawnRange: 3, jarRatio: 0.95, bounce: 0.18 },
  normal: { spawnRange: 4, jarRatio: 0.86, bounce: 0.22 },
  hard: { spawnRange: 4, jarRatio: 0.72, bounce: 0.34 },
};

type FruitTier = {
  level: number;
  name: string;
  color: string;
  radius: number; // px in board coords
  score: number;
};

const FRUIT_TIERS: FruitTier[] = [
  { level: 0, name: "Seed", color: "#86EFAC", radius: 14, score: 1 },
  { level: 1, name: "Berry", color: "#F472B6", radius: 18, score: 3 },
  { level: 2, name: "Plum", color: "#A78BFA", radius: 24, score: 6 },
  { level: 3, name: "Citrus", color: "#FB923C", radius: 32, score: 12 },
  { level: 4, name: "Sun", color: "#FACC15", radius: 42, score: 24 },
  { level: 5, name: "Vault", color: "#0EA5E9", radius: 54, score: 60 },
];

type FruitBody = {
  id: number;
  level: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
};

const GRAVITY = 1500; // px/s^2
const FRICTION = 0.985;

let nextFruitId = 1;

function makeFruit(level: number, x: number, y: number): FruitBody {
  const tier = FRUIT_TIERS[level];
  return {
    id: nextFruitId++,
    level,
    x,
    y,
    vx: 0,
    vy: 0,
    radius: tier.radius,
  };
}

function FruitMergeGameplay({
  title,
  modeId,
  modeLabel,
  accent,
  accentSoft,
  accentInk,
  onQuit,
  onFinish,
}: GameplayScreenProps<FruitMergeModeId>) {
  const settings = MODE_SETTINGS[modeId];
  const { progress, merge, markTutorialSeen } = useGameProgress(GAME_ID);

  const [boardSize, setBoardSize] = useState({ width: 0, height: 0 });
  const [score, setScore] = useState(0);
  const [paused, setPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [tick, setTick] = useState(0); // forces re-render

  const fruitsRef = useRef<FruitBody[]>([]);
  const cursorXRef = useRef(0);
  const [cursorX, setCursorX] = useState(0); // mirror for render
  const [nextLevel, setNextLevel] = useState(() => Math.floor(Math.random() * 3));
  const nextLevelRef = useRef(nextLevel);
  const lastFrameRef = useRef<number>(0);
  const animRef = useRef<number | null>(null);
  const dangerRef = useRef(0); // ms above the danger line
  const dropCooldownRef = useRef(0); // ms until next drop allowed
  const pausedRef = useRef(paused);
  const gameOverRef = useRef(gameOver);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    gameOverRef.current = gameOver;
  }, [gameOver]);

  useEffect(() => {
    nextLevelRef.current = nextLevel;
  }, [nextLevel]);

  // Reset on mode change.
  useEffect(() => {
    fruitsRef.current = [];
    setScore(0);
    setGameOver(false);
    dangerRef.current = 0;
    dropCooldownRef.current = 0;
    setNextLevel(Math.floor(Math.random() * settings.spawnRange));
  }, [modeId, settings.spawnRange]);

  useEffect(() => {
    if (progress && score > progress.bestScore) merge({ bestScore: score });
  }, [score, progress, merge]);

  // Animation loop.
  useEffect(() => {
    if (boardSize.width === 0 || boardSize.height === 0) return;
    let cancelled = false;

    const step = (timestamp: number) => {
      if (cancelled) return;
      if (lastFrameRef.current === 0) lastFrameRef.current = timestamp;
      const rawDt = (timestamp - lastFrameRef.current) / 1000;
      lastFrameRef.current = timestamp;
      const dt = Math.min(0.05, rawDt); // clamp to avoid huge steps

      if (!pausedRef.current && !gameOverRef.current) {
        physicsStep(fruitsRef.current, dt, boardSize, settings, (gained, mergedLevel) => {
          setScore((s) => s + gained);
          if (mergedLevel >= FRUIT_TIERS.length - 1) {
            // Bonus when the biggest fruit forms.
            setScore((s) => s + 100);
          }
        });

        dropCooldownRef.current = Math.max(0, dropCooldownRef.current - dt * 1000);

        const dangerY = 80; // px from top of jar
        const overLine = fruitsRef.current.some((f) => f.y - f.radius < dangerY && Math.abs(f.vy) < 30);
        if (overLine) {
          dangerRef.current += dt * 1000;
          if (dangerRef.current > 1500) {
            setGameOver(true);
          }
        } else {
          dangerRef.current = Math.max(0, dangerRef.current - dt * 1000);
        }

        setTick((t) => (t + 1) % 1000000);
      }

      animRef.current = requestAnimationFrame(step);
    };

    animRef.current = requestAnimationFrame(step);
    return () => {
      cancelled = true;
      if (animRef.current) cancelAnimationFrame(animRef.current);
      animRef.current = null;
      lastFrameRef.current = 0;
    };
  }, [boardSize, settings]);

  // Compute jar bounds inside the board.
  const jarLeft = useMemo(
    () => (boardSize.width * (1 - settings.jarRatio)) / 2,
    [boardSize.width, settings.jarRatio],
  );
  const jarRight = boardSize.width - jarLeft;
  const jarWidth = jarRight - jarLeft;

  // Keep cursor inside the jar.
  useEffect(() => {
    const initial = jarLeft + jarWidth / 2;
    cursorXRef.current = initial;
    setCursorX(initial);
  }, [jarLeft, jarWidth]);

  const onBoardLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setBoardSize({ width, height });
  };

  const moveCursor = useCallback(
    (delta: number) => {
      const radius = FRUIT_TIERS[nextLevelRef.current].radius;
      const next = Math.max(jarLeft + radius, Math.min(jarRight - radius, cursorXRef.current + delta));
      cursorXRef.current = next;
      setCursorX(next);
    },
    [jarLeft, jarRight],
  );

  const aimAt = useCallback(
    (px: number) => {
      const radius = FRUIT_TIERS[nextLevelRef.current].radius;
      const next = Math.max(jarLeft + radius, Math.min(jarRight - radius, px));
      cursorXRef.current = next;
      setCursorX(next);
    },
    [jarLeft, jarRight],
  );

  const handleAim = (event: GestureResponderEvent) => {
    aimAt(event.nativeEvent.locationX);
  };

  const dropFruit = useCallback(() => {
    if (gameOverRef.current || pausedRef.current) return;
    if (dropCooldownRef.current > 0) return;
    const level = nextLevelRef.current;
    const x = cursorXRef.current;
    const y = FRUIT_TIERS[level].radius + 10;
    fruitsRef.current = [...fruitsRef.current, makeFruit(level, x, y)];
    setNextLevel(Math.floor(Math.random() * settings.spawnRange));
    dropCooldownRef.current = 350;
  }, [settings.spawnRange]);

  const restart = useCallback(() => {
    fruitsRef.current = [];
    setScore(0);
    setGameOver(false);
    dangerRef.current = 0;
    dropCooldownRef.current = 0;
    setNextLevel(Math.floor(Math.random() * settings.spawnRange));
  }, [settings.spawnRange]);

  const claimAndExit = useCallback(() => {
    onFinish(score);
  }, [onFinish, score]);

  const hudPills = useMemo(
    () => [
      { label: "Score", value: String(score) },
      { label: "Fruits", value: String(fruitsRef.current.length) },
      { label: "Next", value: FRUIT_TIERS[nextLevel].name },
    ],
    [score, nextLevel, tick],
  );

  const secondaryActions: SecondaryAction[] = useMemo(
    () => [{ label: "Restart", icon: "refresh", onPress: restart }],
    [restart],
  );

  const jarStyle = useMemo(
    () => ({
      left: jarLeft,
      width: jarWidth,
      borderColor: `${accentInk}33`,
    }),
    [jarLeft, jarWidth, accentInk],
  );

  const previewTier = FRUIT_TIERS[nextLevel];

  return (
    <InAppGameShell
      title={title}
      subtitle={`${modeLabel} · ${FRUIT_TIERS.length} fruit tiers`}
      accent={accent}
      accentSoft={accentSoft}
      accentInk={accentInk}
      hudPills={hudPills}
      levelComplete={
        gameOver
          ? {
              title: "Jar overflowed",
              subtitle: `Final score ${score}. Restart for a fresh jar or claim what you've banked.`,
            }
          : null
      }
      onQuit={onQuit}
      onPause={() => setPaused(true)}
      paused={paused}
      onResume={() => setPaused(false)}
      onRestartLevel={() => {
        setPaused(false);
        restart();
      }}
      onClaimExit={claimAndExit}
      onNextLevel={restart}
      nextLevelLabel="New jar"
      secondaryActions={secondaryActions}
      tutorial={{
        visible: progress != null && !progress.tutorialSeen,
        title: "How to play Fruit Merge",
        bullets: TUTORIAL_BULLETS,
        onDismiss: markTutorialSeen,
      }}
    >
      <View style={styles.body}>
        <View style={styles.boardFrame} onLayout={onBoardLayout}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Aim drop position"
            onPress={handleAim}
            style={styles.boardSurface}
          >
            {boardSize.width > 0 ? (
              <>
                {/* Jar bounds */}
                <View style={[styles.jar, jarStyle]} />

                {/* Danger line */}
                <View style={[styles.dangerLine, { left: jarLeft, width: jarWidth }]} />

                {/* Preview cursor */}
                <View
                  style={[
                    styles.previewLine,
                    {
                      left: cursorX,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.fruit,
                    {
                      left: cursorX - previewTier.radius,
                      top: 8,
                      width: previewTier.radius * 2,
                      height: previewTier.radius * 2,
                      borderRadius: previewTier.radius,
                      backgroundColor: previewTier.color,
                      opacity: 0.55,
                      borderColor: accentInk,
                    },
                  ]}
                />

                {/* Live fruits */}
                {fruitsRef.current.map((fruit) => {
                  const tier = FRUIT_TIERS[fruit.level];
                  return (
                    <View
                      key={fruit.id}
                      style={[
                        styles.fruit,
                        {
                          left: fruit.x - fruit.radius,
                          top: fruit.y - fruit.radius,
                          width: fruit.radius * 2,
                          height: fruit.radius * 2,
                          borderRadius: fruit.radius,
                          backgroundColor: tier.color,
                          borderColor: accentInk,
                        },
                      ]}
                    />
                  );
                })}
              </>
            ) : null}
          </Pressable>
        </View>

        <View style={styles.controlRow}>
          <GameActionButton
            label="Left"
            icon="chevron-back"
            onPress={() => moveCursor(-24)}
            tone="secondary"
            accent={accent}
            accentInk={accentInk}
          />
          <GameActionButton
            label="DROP"
            icon="arrow-down"
            onPress={dropFruit}
            disabled={gameOver}
            tone="primary"
            accent={accent}
            accentInk={accentInk}
            flex={1.3}
          />
          <GameActionButton
            label="Right"
            icon="chevron-forward"
            onPress={() => moveCursor(24)}
            tone="secondary"
            accent={accent}
            accentInk={accentInk}
          />
        </View>
      </View>
    </InAppGameShell>
  );
}

function physicsStep(
  fruits: FruitBody[],
  dt: number,
  board: { width: number; height: number },
  settings: ModeSettings,
  onMerge: (gained: number, mergedLevel: number) => void,
) {
  const jarLeft = (board.width * (1 - settings.jarRatio)) / 2;
  const jarRight = board.width - jarLeft;
  const floorY = board.height - 8;

  // Integrate.
  for (const f of fruits) {
    f.vy += GRAVITY * dt;
    f.vx *= FRICTION;
    f.x += f.vx * dt;
    f.y += f.vy * dt;

    if (f.x - f.radius < jarLeft) {
      f.x = jarLeft + f.radius;
      f.vx = Math.abs(f.vx) * settings.bounce;
    }
    if (f.x + f.radius > jarRight) {
      f.x = jarRight - f.radius;
      f.vx = -Math.abs(f.vx) * settings.bounce;
    }
    if (f.y + f.radius > floorY) {
      f.y = floorY - f.radius;
      if (f.vy > 0) f.vy = -f.vy * settings.bounce;
      f.vx *= 0.9;
    }
  }

  // Pairwise resolution + merge.
  const merged = new Set<number>();
  for (let i = 0; i < fruits.length; i++) {
    if (merged.has(fruits[i].id)) continue;
    for (let j = i + 1; j < fruits.length; j++) {
      if (merged.has(fruits[j].id)) continue;
      const a = fruits[i];
      const b = fruits[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = a.radius + b.radius;
      if (dist === 0 || dist >= minDist) continue;

      if (a.level === b.level && a.level < FRUIT_TIERS.length - 1) {
        // Merge.
        merged.add(a.id);
        merged.add(b.id);
        const newLevel = a.level + 1;
        const tier = FRUIT_TIERS[newLevel];
        const mid: FruitBody = {
          id: nextFruitId++,
          level: newLevel,
          x: (a.x + b.x) / 2,
          y: (a.y + b.y) / 2,
          vx: (a.vx + b.vx) * 0.4,
          vy: (a.vy + b.vy) * 0.4 - 60,
          radius: tier.radius,
        };
        fruits.push(mid);
        onMerge(tier.score, newLevel);
        continue;
      }

      // Resolve overlap.
      const overlap = minDist - dist;
      const nx = dx / dist;
      const ny = dy / dist;
      a.x -= nx * overlap * 0.5;
      a.y -= ny * overlap * 0.5;
      b.x += nx * overlap * 0.5;
      b.y += ny * overlap * 0.5;

      // Exchange a fraction of velocity along the normal.
      const va = a.vx * nx + a.vy * ny;
      const vb = b.vx * nx + b.vy * ny;
      const restitution = settings.bounce;
      const impulse = (vb - va) * (1 + restitution) * 0.5;
      a.vx += impulse * nx;
      a.vy += impulse * ny;
      b.vx -= impulse * nx;
      b.vy -= impulse * ny;
    }
  }

  if (merged.size > 0) {
    // Mutate array in place so the ref keeps pointing at the same list.
    for (let i = fruits.length - 1; i >= 0; i--) {
      if (merged.has(fruits[i].id)) fruits.splice(i, 1);
    }
  }
}

const FruitMergeGame = createGameRoute<FruitMergeModeId>({
  gameId: "fruit-merge",
  modeOptions: MODE_OPTIONS,
  GameplayScreen: FruitMergeGameplay,
});

export default FruitMergeGame;

const styles = StyleSheet.create({
  body: {
    flex: 1,
    gap: 10,
  },
  boardFrame: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: V2.hairline,
    backgroundColor: "rgba(255,255,255,0.78)",
    overflow: "hidden",
  },
  boardSurface: {
    flex: 1,
  },
  jar: {
    position: "absolute",
    top: 0,
    bottom: 0,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderTopWidth: 0,
    borderRadius: 16,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  dangerLine: {
    position: "absolute",
    top: 80,
    height: 1,
    backgroundColor: "rgba(225,29,72,0.45)",
  },
  previewLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  fruit: {
    position: "absolute",
    borderWidth: 1.5,
  },
  controlRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 10,
  },
});
