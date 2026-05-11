import React, { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MotiView } from "moti";
import Svg, { Circle, Path, Rect } from "react-native-svg";

import { GameArt } from "./GameArt";
import {
  GAME_CONFIGS,
  GT,
  type GameConfig,
  type GameMode,
} from "../../constants/gameTemplates";

type Props = {
  gameConfig: GameConfig;
  onClose?: () => void;
  onPlay?: (mode: GameMode) => void;
  onLeaderboard?: () => void;
  onStats?: () => void;
  onSettings?: () => void;
};

// Mirrors GameLanding in game-templates.jsx after the chat2 layout rework:
// big centered title, mode pill row, large Play CTA, three pill actions
// underneath, daily-tasks tab anchored to the middle-left edge with a
// bottom-sheet overlay.
export function GameLanding({
  gameConfig,
  onClose,
  onPlay,
  onLeaderboard,
  onStats,
  onSettings,
}: Props) {
  const cfg = gameConfig;
  const [modeId, setModeId] = useState(cfg.modes[0]?.id ?? "");
  const [tasksOpen, setTasksOpen] = useState(false);
  const selected = cfg.modes.find((m) => m.id === modeId) ?? cfg.modes[0];

  const tasksRemaining = useMemo(
    () => cfg.tasks.filter((t) => !(t.done || t.p >= t.t)).length,
    [cfg.tasks],
  );

  return (
    <View style={styles.root}>
      {/* soft accent halo behind the page */}
      <View
        pointerEvents="none"
        style={[
          styles.halo,
          { backgroundColor: cfg.accentSoft },
        ]}
      />

      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        {/* Top bar — back / streak chip / spacer */}
        <View style={styles.topBar}>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
          >
            <BackIcon color={GT.ink} />
          </Pressable>

          <View style={[styles.streakChip, { backgroundColor: cfg.accentSoft }]}>
            <FireIcon color={cfg.accentInk} />
            <Text style={[styles.streakText, { color: cfg.accentInk }]}>
              7-DAY STREAK · +25%
            </Text>
          </View>

          <View style={{ width: 40, height: 40 }} />
        </View>

        {/* Centered content stack */}
        <View style={styles.center}>
          {/* Big title block */}
          <View style={styles.centerTitleBlock}>
            <Text style={[styles.eyebrow, { color: cfg.accentInk }]}>
              VAULT · IN-APP GAME
            </Text>
            <Text style={styles.title}>{cfg.name}</Text>
            <Text style={styles.tagline}>{cfg.tagline}</Text>
          </View>

          {/* Game art halo */}
          <View style={styles.heroArt}>
            <GameArt kind={cfg.art} accent={cfg.accent} width={170} height={120} />
          </View>

          {/* Mode selector — small horizontal pill row */}
          <View style={styles.modesBlock}>
            <Text style={styles.modesEyebrow}>GAME MODE</Text>
            <View style={styles.modesRow}>
              {cfg.modes.map((m) => {
                const active = m.id === modeId;
                return (
                  <Pressable
                    key={m.id}
                    onPress={() => setModeId(m.id)}
                    style={({ pressed }) => [
                      styles.modeBtn,
                      active && styles.modeBtnActive,
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <View style={styles.modeLabelRow}>
                      <Text
                        style={[
                          styles.modeLabel,
                          { color: active ? GT.ink : GT.muted },
                        ]}
                      >
                        {m.label}
                      </Text>
                      {m.tag && active ? <ModeTag tag={m.tag} /> : null}
                    </View>
                    <Text
                      style={[
                        styles.modeSub,
                        { color: active ? GT.muted : GT.faint },
                      ]}
                    >
                      {m.sub}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Big PLAY button */}
          <Pressable
            onPress={() => {
              if (selected) onPlay?.(selected);
            }}
            style={({ pressed }) => [
              styles.playBtn,
              {
                backgroundColor: cfg.accent,
                shadowColor: cfg.accent,
              },
              pressed && { opacity: 0.92 },
            ]}
          >
            <PlayIcon color="#fff" />
            <Text style={styles.playLabel}>Play {selected?.label ?? ""}</Text>
          </Pressable>

          {/* Three pill actions below Play */}
          <View style={styles.actions}>
            <ActionBtn
              icon={<TrophyIcon color={cfg.accent} />}
              label="Leaderboard"
              onPress={onLeaderboard}
            />
            <ActionBtn
              icon={<StatsIcon color={cfg.accent} />}
              label="Stats"
              onPress={onStats}
            />
            <ActionBtn
              icon={<SettingsIcon color={cfg.accent} />}
              label="Settings"
              onPress={onSettings}
            />
          </View>
        </View>

        {/* Daily tasks tab — middle-left edge */}
        <Pressable
          onPress={() => setTasksOpen(true)}
          style={({ pressed }) => [
            styles.tasksTab,
            { transform: [{ translateY: -28 }] },
            pressed && { opacity: 0.85 },
          ]}
          hitSlop={6}
        >
          <View style={[styles.tasksGlyph, { backgroundColor: GT.amberSoft }]}>
            <CheckIcon color={GT.amber} />
            {tasksRemaining > 0 ? (
              <View style={styles.tasksBadge}>
                <Text style={styles.tasksBadgeText}>{tasksRemaining}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.tasksTabLabel}>Tasks</Text>
        </Pressable>

        {/* Tasks sheet */}
        <Modal
          visible={tasksOpen}
          transparent
          animationType="none"
          statusBarTranslucent
          onRequestClose={() => setTasksOpen(false)}
        >
          <View style={StyleSheet.absoluteFill}>
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: "timing", duration: 200 }}
              style={styles.scrim}
            >
              <Pressable style={StyleSheet.absoluteFill} onPress={() => setTasksOpen(false)} />
            </MotiView>
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 280 }}
              style={styles.sheet}
            >
              <View style={styles.sheetHeader}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={styles.sheetDot} />
                  <Text style={styles.sheetTitle}>Daily tasks</Text>
                </View>
                <Text style={styles.sheetReset}>resets in 14h</Text>
              </View>
              {cfg.tasks.map((t, i) => {
                const done = t.done || t.p >= t.t;
                const isLast = i === cfg.tasks.length - 1;
                const pctWidth = `${Math.min(100, (t.p / t.t) * 100)}%` as const;
                return (
                  <View
                    key={`${t.l}-${i}`}
                    style={[styles.taskRow, !isLast && styles.taskRowDivider, done && { opacity: 0.6 }]}
                  >
                    <View
                      style={[
                        styles.taskMark,
                        { backgroundColor: done ? GT.amberSoft : "rgba(0,0,0,0.04)" },
                      ]}
                    >
                      {done ? (
                        <CheckIcon color={GT.amber} />
                      ) : (
                        <Text style={styles.taskFraction}>
                          {t.p}/{t.t}
                        </Text>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.taskLabel,
                          done && { textDecorationLine: "line-through" },
                        ]}
                      >
                        {t.l}
                      </Text>
                      <View style={styles.taskTrack}>
                        <View
                          style={[
                            styles.taskTrackFill,
                            {
                              width: pctWidth,
                              backgroundColor: done ? GT.amber : cfg.accent,
                            },
                          ]}
                        />
                      </View>
                    </View>
                    <View style={styles.taskReward}>
                      <Text style={styles.taskRewardText}>{t.reward}</Text>
                    </View>
                  </View>
                );
              })}
            </MotiView>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

// ── Sub-components ──────────────────────────────────────────────

function ActionBtn({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.85 }]}
    >
      <View style={styles.actionIcon}>{icon}</View>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

function ModeTag({ tag }: { tag: NonNullable<GameMode["tag"]> }) {
  const palette =
    tag === "LIVE"
      ? { bg: "#FCE4E4", fg: "#9B1C1C" }
      : tag === "HOT"
        ? { bg: GT.amberSoft, fg: GT.amberInk }
        : tag === "FAST"
          ? { bg: GT.cyanSoft, fg: GT.cyanInk }
          : { bg: GT.cyanSoft, fg: GT.cyanInk };
  return (
    <View style={[styles.modeTag, { backgroundColor: palette.bg }]}>
      <Text style={[styles.modeTagText, { color: palette.fg }]}>{tag}</Text>
    </View>
  );
}

// ── Icons ──────────────────────────────────────────────────────
function BackIcon({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
      <Path
        d="M9 2L4 7l5 5"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
function FireIcon({ color }: { color: string }) {
  return (
    <Svg width={12} height={14} viewBox="0 0 14 16">
      <Path
        d="M7 1s4 3.5 4 7a4 4 0 11-8 0c0-1.3 1-2.2 1-2.2S3 8 3 10a4 4 0 108 0c0-4.5-4-9-4-9z"
        fill={color}
      />
    </Svg>
  );
}
function PlayIcon({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14">
      <Path d="M3 2l9 5-9 5V2z" fill={color} />
    </Svg>
  );
}
function TrophyIcon({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <Path d="M3 2h10v3.5a5 5 0 01-10 0V2z" fill={color} />
      <Path
        d="M3 4H1v1.5A2.5 2.5 0 003.2 8M13 4h2v1.5A2.5 2.5 0 0112.8 8M8 10v2.5M5.5 14h5"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </Svg>
  );
}
function StatsIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
      <Rect x={2} y={10} width={3} height={6} rx={1} fill={color} />
      <Rect x={7.5} y={6} width={3} height={10} rx={1} fill={color} />
      <Rect x={13} y={2} width={3} height={14} rx={1} fill={color} />
    </Svg>
  );
}
function SettingsIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
      <Circle cx={9} cy={9} r={2.5} stroke={color} strokeWidth={1.7} />
      <Path
        d="M9 1v2M9 15v2M1 9h2M15 9h2M3.5 3.5l1.4 1.4M13.1 13.1l1.4 1.4M3.5 14.5l1.4-1.4M13.1 4.9l1.4-1.4"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </Svg>
  );
}
function CheckIcon({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
      <Path
        d="M3 7.5l3 3 5-6"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Re-export configs so consumers don't have to hop through two imports.
export { GAME_CONFIGS };

// ── Styles ─────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: GT.bg },
  halo: {
    position: "absolute",
    top: -140,
    left: "50%",
    marginLeft: -300,
    width: 600,
    height: 460,
    borderRadius: 300,
    opacity: 0.65,
  },
  topBar: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.86)",
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  streakChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 13,
  },
  streakText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.6 },

  center: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: "stretch",
    justifyContent: "center",
  },
  centerTitleBlock: {
    alignItems: "center",
    alignSelf: "stretch",
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.6,
  },
  title: {
    marginTop: 8,
    fontSize: 54,
    fontWeight: "800",
    color: GT.ink,
    letterSpacing: -2.2,
    lineHeight: 56,
    textAlign: "center",
  },
  tagline: {
    marginTop: 10,
    fontSize: 14,
    color: GT.muted,
  },
  heroArt: {
    width: 170,
    height: 120,
    marginTop: 18,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
  },

  modesBlock: { width: "100%", alignSelf: "stretch", marginTop: 18 },
  modesEyebrow: {
    fontSize: 10,
    fontWeight: "700",
    color: GT.muted,
    letterSpacing: 1,
    textAlign: "center",
    marginBottom: 8,
  },
  modesRow: {
    flexDirection: "row",
    gap: 6,
    padding: 4,
    backgroundColor: "rgba(0,0,0,0.04)",
    borderRadius: 14,
  },
  modeBtn: {
    flex: 1,
    paddingHorizontal: 6,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  modeBtnActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  modeLabelRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  modeLabel: { fontSize: 12, fontWeight: "700", letterSpacing: -0.1 },
  modeSub: { marginTop: 2, fontSize: 9.5, fontWeight: "500" },
  modeTag: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  modeTagText: { fontSize: 8, fontWeight: "800", letterSpacing: 0.6 },

  playBtn: {
    width: "100%",
    alignSelf: "stretch",
    height: 64,
    marginTop: 14,
    borderRadius: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowOpacity: 0.4,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 16 },
    elevation: 6,
  },
  playLabel: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: -0.3,
  },

  actions: {
    width: "100%",
    alignSelf: "stretch",
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.07)",
    alignItems: "center",
    gap: 6,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  actionIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: GT.ink,
    letterSpacing: 0.1,
  },

  tasksTab: {
    position: "absolute",
    left: 0,
    top: "46%",
    backgroundColor: "#FFFFFF",
    borderWidth: 0.5,
    borderLeftWidth: 0,
    borderColor: "rgba(0,0,0,0.08)",
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
    paddingVertical: 10,
    paddingLeft: 8,
    paddingRight: 10,
    alignItems: "center",
    gap: 4,
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  tasksGlyph: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  tasksBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 14,
    height: 14,
    paddingHorizontal: 3,
    borderRadius: 7,
    backgroundColor: GT.amber,
    alignItems: "center",
    justifyContent: "center",
  },
  tasksBadgeText: { color: "#fff", fontSize: 9, fontWeight: "800" },
  tasksTabLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: GT.ink,
    letterSpacing: 0.2,
  },

  scrim: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.32)",
  },
  sheet: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 24,
    backgroundColor: GT.card,
    borderRadius: 24,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 60,
    shadowOffset: { width: 0, height: 30 },
    elevation: 20,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sheetDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: GT.amber },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: GT.ink,
    letterSpacing: -0.2,
  },
  sheetReset: { fontSize: 12, color: GT.muted },

  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  taskRowDivider: {
    borderBottomWidth: 0.5,
    borderBottomColor: GT.hairline,
  },
  taskMark: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  taskFraction: {
    fontSize: 12,
    fontWeight: "800",
    color: GT.muted,
    fontVariant: ["tabular-nums"],
  },
  taskLabel: { fontSize: 13, fontWeight: "600", color: GT.ink },
  taskTrack: {
    marginTop: 6,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(0,0,0,0.06)",
    overflow: "hidden",
  },
  taskTrackFill: { height: "100%" },
  taskReward: {
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 8,
    backgroundColor: GT.amberSoft,
  },
  taskRewardText: {
    fontSize: 11,
    fontWeight: "800",
    color: GT.amberInk,
    letterSpacing: 0.2,
  },
});
