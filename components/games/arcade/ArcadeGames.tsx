import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { typography } from "../../../constants/typography";

type GameKind = "block" | "bricks" | "stack";

const PALETTES = {
  block: {
    bg: "#151044",
    panel: "#221A68",
    accent: "#00E5FF",
    accent2: "#FFCC00",
    text: "#FFFFFF",
    muted: "rgba(255,255,255,0.68)",
  },
  bricks: {
    bg: "#180B2E",
    panel: "#28124F",
    accent: "#FF4D8D",
    accent2: "#54F2C4",
    text: "#FFFFFF",
    muted: "rgba(255,255,255,0.68)",
  },
  stack: {
    bg: "#081F2D",
    panel: "#0E3548",
    accent: "#8BFF5A",
    accent2: "#FFE45C",
    text: "#FFFFFF",
    muted: "rgba(255,255,255,0.68)",
  },
} as const;

const BLOCK_COLORS = ["#00E5FF", "#FF4D8D", "#FFCC00", "#8BFF5A", "#A78BFA"];

function makeBlockBoard(level: number) {
  return Array.from({ length: 64 }, (_, index) => {
    const seeded = (index * 17 + level * 11) % 9;
    return seeded < 4 ? BLOCK_COLORS[(index + level) % BLOCK_COLORS.length] : null;
  });
}

function makeBricks(level: number) {
  return Array.from({ length: 30 }, (_, index) => {
    const row = Math.floor(index / 6);
    const value = ((index + row + level) % 4) + level;
    return value <= level + 1 ? value : 0;
  });
}

export function BlockBlastGame() {
  return <ArcadeShell kind="block" title="Block Blast" subtitle="Clear rows and columns" icon="view-grid-plus-outline"><BlockBlastBoard /></ArcadeShell>;
}

export function BricksVsBallsGame() {
  return <ArcadeShell kind="bricks" title="Bricks vs Balls" subtitle="Aim, launch, level up" icon="target"><BricksVsBallsBoard /></ArcadeShell>;
}

export function ColorStackGame() {
  return <ArcadeShell kind="stack" title="Color Stack" subtitle="Build the tower by level" icon="layers-triple-outline"><ColorStackBoard /></ArcadeShell>;
}

function ArcadeShell({
  kind,
  title,
  subtitle,
  icon,
  children,
}: {
  kind: GameKind;
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const palette = PALETTES[kind];
  return (
    <View style={[styles.root, { backgroundColor: palette.bg }]}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.replace("/games-in-app");
            }}
            style={styles.iconButton}
          >
            <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          <View style={[styles.gameBadge, { backgroundColor: palette.panel }]}>
            <MaterialCommunityIcons name={icon} size={20} color={palette.accent} />
          </View>
        </View>
        {children}
      </SafeAreaView>
    </View>
  );
}

function BlockBlastBoard() {
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(120);
  const [board, setBoard] = useState<(string | null)[]>(() => makeBlockBoard(1));
  const palette = PALETTES.block;
  const filled = board.filter(Boolean).length;

  const tapCell = (idx: number) => {
    setBoard((current) => {
      if (!current[idx]) return current.map((cell, i) => (i === idx ? BLOCK_COLORS[(i + level) % BLOCK_COLORS.length] : cell));
      const next = [...current];
      const color = current[idx];
      const group = [idx, idx - 1, idx + 1, idx - 8, idx + 8].filter((i) => i >= 0 && i < 64 && current[i] === color);
      group.forEach((i) => (next[i] = null));
      setScore((value) => value + group.length * 14);
      return next;
    });
  };

  const nextLevel = () => {
    const next = level + 1;
    setLevel(next);
    setScore((value) => value + 150);
    setBoard(makeBlockBoard(next));
  };

  return (
    <View style={styles.gameBody}>
      <GameStats palette={palette} level={level} score={score} third={`${filled}/64`} thirdLabel="filled" />
      <View style={[styles.blockBoard, { backgroundColor: palette.panel }]}>
        {board.map((cell, idx) => (
          <Pressable
            key={idx}
            onPress={() => tapCell(idx)}
            style={[styles.blockCell, { backgroundColor: cell ?? "rgba(255,255,255,0.08)" }]}
          />
        ))}
      </View>
      <Pressable onPress={nextLevel} style={[styles.primaryGameButton, { backgroundColor: palette.accent }]}>
        <Text style={[styles.primaryGameText, { color: "#071926" }]}>Next level</Text>
      </Pressable>
    </View>
  );
}

function BricksVsBallsBoard() {
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [balls, setBalls] = useState(8);
  const [bricks, setBricks] = useState(() => makeBricks(1));
  const palette = PALETTES.bricks;
  const remaining = bricks.filter((value) => value > 0).length;

  const launch = (lane: number) => {
    setBricks((current) => {
      const next = [...current];
      for (let row = 4; row >= 0; row -= 1) {
        const idx = row * 6 + lane;
        if (next[idx] > 0) {
          next[idx] = Math.max(0, next[idx] - balls);
          setScore((value) => value + balls * 9);
          break;
        }
      }
      return next;
    });
  };

  const nextLevel = () => {
    const next = level + 1;
    setLevel(next);
    setBalls((value) => value + 2);
    setBricks(makeBricks(next));
  };

  return (
    <View style={styles.gameBody}>
      <GameStats palette={palette} level={level} score={score} third={`${balls}`} thirdLabel="balls" />
      <View style={[styles.brickBoard, { backgroundColor: palette.panel }]}>
        {bricks.map((value, idx) => (
          <View key={idx} style={[styles.brick, value === 0 && styles.brickEmpty, { backgroundColor: value > 0 ? (value > level ? palette.accent : palette.accent2) : "transparent" }]}>
            {value > 0 ? <Text style={styles.brickText}>{value}</Text> : null}
          </View>
        ))}
      </View>
      <View style={styles.laneRow}>
        {Array.from({ length: 6 }).map((_, lane) => (
          <Pressable key={lane} onPress={() => launch(lane)} style={[styles.laneButton, { borderColor: palette.accent }]}>
            <Text style={[styles.laneText, { color: palette.accent }]}>Aim {lane + 1}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable onPress={nextLevel} disabled={remaining > 0} style={[styles.primaryGameButton, { backgroundColor: remaining > 0 ? "rgba(255,255,255,0.18)" : palette.accent }]}>
        <Text style={styles.primaryGameText}>{remaining > 0 ? `${remaining} bricks left` : "Next level"}</Text>
      </Pressable>
    </View>
  );
}

function ColorStackBoard() {
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(80);
  const [stack, setStack] = useState<string[]>(["#8BFF5A", "#FFE45C"]);
  const [target, setTarget] = useState(6);
  const palette = PALETTES.stack;
  const complete = stack.length >= target;

  const addBlock = (color: string) => {
    if (complete) return;
    setStack((current) => [...current, color]);
    setScore((value) => value + 25);
  };

  const nextLevel = () => {
    setLevel((value) => value + 1);
    setTarget((value) => value + 2);
    setStack(["#8BFF5A", "#FFE45C"]);
  };

  return (
    <View style={styles.gameBody}>
      <GameStats palette={palette} level={level} score={score} third={`${stack.length}/${target}`} thirdLabel="tower" />
      <View style={[styles.stackStage, { backgroundColor: palette.panel }]}>
        {[...stack].reverse().map((color, idx) => (
          <View key={`${color}-${idx}`} style={[styles.stackBlock, { backgroundColor: color, width: `${72 - idx * 4}%` }]} />
        ))}
      </View>
      <View style={styles.colorRow}>
        {["#8BFF5A", "#FFE45C", "#FF4D8D", "#00E5FF"].map((color) => (
          <Pressable key={color} onPress={() => addBlock(color)} style={[styles.colorButton, { backgroundColor: color }]} />
        ))}
      </View>
      <Pressable onPress={nextLevel} disabled={!complete} style={[styles.primaryGameButton, { backgroundColor: complete ? palette.accent : "rgba(255,255,255,0.18)" }]}>
        <Text style={[styles.primaryGameText, { color: complete ? "#071926" : "#FFFFFF" }]}>{complete ? "Level cleared" : "Reach the target"}</Text>
      </Pressable>
    </View>
  );
}

function GameStats({
  palette,
  level,
  score,
  third,
  thirdLabel,
}: {
  palette: (typeof PALETTES)[GameKind];
  level: number;
  score: number;
  third: string;
  thirdLabel: string;
}) {
  return (
    <View style={styles.statRow}>
      <StatBox label="level" value={`${level}`} palette={palette} />
      <StatBox label="score" value={`${score}`} palette={palette} />
      <StatBox label={thirdLabel} value={third} palette={palette} />
    </View>
  );
}

function StatBox({ label, value, palette }: { label: string; value: string; palette: (typeof PALETTES)[GameKind] }) {
  return (
    <View style={[styles.statBox, { backgroundColor: palette.panel }]}>
      <Text style={[styles.statValue, { color: palette.accent }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: palette.muted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topBar: {
    minHeight: 66,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    ...typography.bold,
    fontSize: 25,
    color: "#FFFFFF",
  },
  subtitle: {
    ...typography.semibold,
    marginTop: 2,
    fontSize: 12,
    color: "rgba(255,255,255,0.62)",
  },
  gameBadge: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  gameBody: {
    flex: 1,
    paddingHorizontal: 18,
    paddingBottom: 18,
    gap: 14,
  },
  statRow: {
    flexDirection: "row",
    gap: 10,
  },
  statBox: {
    flex: 1,
    borderRadius: 18,
    padding: 13,
  },
  statValue: {
    ...typography.bold,
    fontSize: 21,
  },
  statLabel: {
    ...typography.semibold,
    marginTop: 2,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  blockBoard: {
    aspectRatio: 1,
    borderRadius: 26,
    padding: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  blockCell: {
    width: "11.8%",
    aspectRatio: 1,
    borderRadius: 8,
  },
  brickBoard: {
    borderRadius: 26,
    padding: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  brick: {
    width: "14.6%",
    aspectRatio: 1.16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  brickEmpty: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  brickText: {
    ...typography.bold,
    color: "#FFFFFF",
    fontSize: 15,
  },
  laneRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  laneButton: {
    width: "31%",
    minHeight: 40,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  laneText: {
    ...typography.bold,
    fontSize: 11,
  },
  stackStage: {
    flex: 1,
    minHeight: 260,
    borderRadius: 26,
    padding: 18,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  stackBlock: {
    height: 32,
    borderRadius: 10,
    marginTop: 5,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.16)",
  },
  colorRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  colorButton: {
    width: 54,
    height: 54,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.36)",
  },
  primaryGameButton: {
    minHeight: 54,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryGameText: {
    ...typography.bold,
    fontSize: 15,
    color: "#FFFFFF",
  },
});
