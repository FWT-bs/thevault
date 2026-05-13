import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { V2 } from "../../../constants/glassPalette";
import { typography } from "../../../constants/typography";
import {
  createGameRoute,
  type GameModeOption,
  type GameplayScreenProps,
} from "../createGameRoute";
import { InAppGameShell, type SecondaryAction } from "../_template/InAppGameShell";

type ColorStackModeId = "classic" | "challenge" | "expert";

const MODE_OPTIONS: ReadonlyArray<GameModeOption<ColorStackModeId>> = [
  {
    id: "classic",
    label: "Classic",
    description: "Stack 6 to start; +2 per level.",
  },
  {
    id: "challenge",
    label: "Challenge",
    description: "Begin at level 4 with a taller target.",
  },
  {
    id: "expert",
    label: "Expert",
    description: "Begin at level 7 and match the pattern exactly.",
  },
];

const MODE_START_LEVEL: Record<ColorStackModeId, number> = {
  classic: 1,
  challenge: 4,
  expert: 7,
};

type StackColor = {
  id: string;
  hex: string;
  label: string;
};

const PALETTE: StackColor[] = [
  { id: "mint", hex: "#3CB371", label: "Mint" },
  { id: "sun", hex: "#F6D98A", label: "Sun" },
  { id: "rose", hex: "#F4A4A4", label: "Rose" },
  { id: "sky", hex: "#A9E5FF", label: "Sky" },
  { id: "lilac", hex: "#BFA8F0", label: "Lilac" },
];

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function targetForLevel(level: number) {
  return 6 + (level - 1) * 2;
}

function patternForLevel(level: number, modeId: ColorStackModeId): string[] {
  const rng = mulberry32(level * 271828 + modeId.length * 11);
  const length = targetForLevel(level);
  return Array.from({ length }, () => PALETTE[Math.floor(rng() * PALETTE.length)].id);
}

function ColorStackGameplay({
  title,
  modeId,
  modeLabel,
  accent,
  accentSoft,
  accentInk,
  onQuit,
  onFinish,
}: GameplayScreenProps<ColorStackModeId>) {
  const startLevel = MODE_START_LEVEL[modeId];
  const [level, setLevel] = useState(startLevel);
  const [score, setScore] = useState(0);
  const [paused, setPaused] = useState(false);
  const [stack, setStack] = useState<string[]>([]);

  const target = useMemo(() => targetForLevel(level), [level]);
  const pattern = useMemo(() => patternForLevel(level, modeId), [level, modeId]);

  useEffect(() => {
    setLevel(MODE_START_LEVEL[modeId]);
    setScore(0);
  }, [modeId]);

  useEffect(() => {
    setStack([]);
  }, [level]);

  const matchCount = useMemo(() => {
    let count = 0;
    for (let i = 0; i < stack.length && i < pattern.length; i++) {
      if (stack[i] === pattern[i]) count += 1;
    }
    return count;
  }, [stack, pattern]);

  const stackHeight = stack.length;
  const complete = stackHeight >= target;
  const perfectMatch = complete && matchCount === target;

  const addBlock = useCallback(
    (colorId: string) => {
      if (complete) return;
      setStack((current) => {
        const next = [...current, colorId];
        const idx = next.length - 1;
        const matched = idx < pattern.length && pattern[idx] === colorId;
        setScore((value) => value + (matched ? 30 + level * 2 : 10));
        return next;
      });
    },
    [complete, pattern, level],
  );

  const undo = useCallback(() => {
    if (complete) return;
    setStack((current) => {
      if (current.length === 0) return current;
      setScore((value) => Math.max(0, value - 5));
      return current.slice(0, -1);
    });
  }, [complete]);

  const restartLevel = useCallback(() => {
    setStack([]);
  }, []);

  const continueToNextLevel = useCallback(() => {
    setScore((value) => value + 50 + level * 10 + (perfectMatch ? 80 : 0));
    setLevel((value) => value + 1);
  }, [level, perfectMatch]);

  const claimAndExit = useCallback(() => {
    onFinish(score);
  }, [onFinish, score]);

  const hudPills = useMemo(
    () => [
      { label: "Score", value: String(score) },
      { label: "Level", value: String(level) },
      { label: "Tower", value: `${Math.min(stackHeight, target)}/${target}` },
    ],
    [score, level, stackHeight, target],
  );

  const secondaryActions: SecondaryAction[] = useMemo(
    () => [
      {
        label: "Undo",
        icon: "arrow-undo",
        onPress: undo,
        disabled: stackHeight === 0,
      },
      { label: "Restart", icon: "refresh", onPress: restartLevel },
    ],
    [undo, restartLevel, stackHeight],
  );

  const colorById = useMemo(() => {
    const map: Record<string, StackColor> = {};
    for (const color of PALETTE) map[color.id] = color;
    return map;
  }, []);

  return (
    <InAppGameShell
      title={title}
      subtitle={`${modeLabel} · Level ${level}`}
      accent={accent}
      accentSoft={accentSoft}
      accentInk={accentInk}
      hudPills={hudPills}
      levelComplete={
        complete
          ? {
              title: `Tower built · level ${level}`,
              subtitle: perfectMatch
                ? `Perfect pattern! +80 bonus · Next: level ${level + 1} (${targetForLevel(level + 1)} blocks)`
                : `${matchCount}/${target} matched the pattern · Next: level ${level + 1} (${targetForLevel(level + 1)} blocks)`,
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
        <View style={styles.patternCard}>
          <View style={styles.patternHeader}>
            <Text style={styles.patternLabel}>Pattern hint</Text>
            <Text style={styles.patternMeta}>
              {matchCount}/{target} matched
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.patternRow}
          >
            {pattern.map((id, idx) => {
              const color = colorById[id];
              const matched = idx < stack.length && stack[idx] === id;
              const placed = idx < stack.length && stack[idx] !== id;
              return (
                <View
                  key={`${id}-${idx}`}
                  style={[
                    styles.patternChip,
                    { backgroundColor: color.hex },
                    matched && { borderColor: accentInk, borderWidth: 2 },
                    placed && styles.patternChipMiss,
                  ]}
                />
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.towerArea}>
          <Text style={styles.towerLabel}>Your tower</Text>
          <View style={styles.tower}>
            {[...stack].reverse().map((id, idx) => {
              const color = colorById[id];
              const reverseIdx = stack.length - 1 - idx;
              const matched = pattern[reverseIdx] === id;
              return (
                <View
                  key={`${id}-${reverseIdx}`}
                  style={[
                    styles.towerBlock,
                    {
                      backgroundColor: color.hex,
                      width: `${Math.max(46, 86 - idx * 3)}%`,
                      borderColor: matched ? accentInk : "rgba(0,0,0,0.18)",
                      borderWidth: matched ? 2 : 1,
                    },
                  ]}
                />
              );
            })}
            {stack.length === 0 && (
              <Text style={styles.towerEmpty}>Tap a color below to start building.</Text>
            )}
          </View>
        </View>

        <View style={styles.colorRow}>
          {PALETTE.map((color) => (
            <Pressable
              key={color.id}
              accessibilityRole="button"
              accessibilityLabel={`Add ${color.label} block`}
              onPress={() => addBlock(color.id)}
              disabled={complete}
              style={({ pressed }) => [
                styles.colorButton,
                { backgroundColor: color.hex },
                pressed && !complete && styles.colorButtonPressed,
                complete && styles.colorButtonDisabled,
              ]}
            >
              <Ionicons name="add" size={20} color="rgba(0,0,0,0.45)" />
            </Pressable>
          ))}
        </View>
      </View>
    </InAppGameShell>
  );
}

const ColorStackGame = createGameRoute<ColorStackModeId>({
  gameId: "color-stack",
  modeOptions: MODE_OPTIONS,
  GameplayScreen: ColorStackGameplay,
});

export default ColorStackGame;

const styles = StyleSheet.create({
  body: {
    flex: 1,
    gap: 12,
  },
  patternCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: V2.hairline,
    backgroundColor: "rgba(255,255,255,0.82)",
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  patternHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  patternLabel: {
    ...typography.bold,
    fontSize: 10,
    color: V2.muted,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  patternMeta: {
    ...typography.semibold,
    fontSize: 11,
    color: V2.muted,
    fontVariant: ["tabular-nums"],
  },
  patternRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  patternChip: {
    width: 22,
    height: 22,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
  },
  patternChipMiss: {
    opacity: 0.55,
  },
  towerArea: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: V2.hairline,
    backgroundColor: "rgba(255,255,255,0.74)",
    padding: 14,
  },
  towerLabel: {
    ...typography.bold,
    fontSize: 10,
    color: V2.muted,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  tower: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
    marginTop: 6,
  },
  towerBlock: {
    height: 26,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.16)",
  },
  towerEmpty: {
    ...typography.semibold,
    flex: 1,
    fontSize: 12,
    color: V2.muted,
    fontStyle: "italic",
    textAlign: "center",
    textAlignVertical: "center",
  },
  colorRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  colorButton: {
    flex: 1,
    height: 60,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  colorButtonPressed: {
    opacity: 0.78,
  },
  colorButtonDisabled: {
    opacity: 0.5,
  },
});
