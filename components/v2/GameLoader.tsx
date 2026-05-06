import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MotiView } from "moti";
import Svg, { Circle, Path } from "react-native-svg";

import { GameArt } from "./GameArt";
import { GT, type GameConfig } from "../../constants/gameTemplates";

type Props = {
  gameConfig: GameConfig;
  onReady?: () => void;
};

// Mirrors GameLoader in game-templates.jsx — non-linear progress, rotating
// tip carousel, accent halo behind a hero plate.
export function GameLoader({ gameConfig, onReady }: Props) {
  const cfg = gameConfig;
  const [pct, setPct] = useState(0);
  const [tipIdx, setTipIdx] = useState(0);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useEffect(() => {
    let p = 0;
    let done = false;
    const tick = setInterval(() => {
      const step = Math.max(0.4, (100 - p) * 0.06);
      p = Math.min(100, p + step);
      setPct(p);
      if (p >= 100 && !done) {
        done = true;
        clearInterval(tick);
        setTimeout(() => onReadyRef.current?.(), 380);
      }
    }, 60);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    const len = cfg.tips.length;
    if (len === 0) return;
    const r = setInterval(() => setTipIdx((i) => (i + 1) % len), 2400);
    return () => clearInterval(r);
  }, [cfg.tips.length]);

  return (
    <View style={styles.root}>
      {/* Soft accent backdrop — radial gradient is approximated with a
          diffuse circular wash sitting under the hero. */}
      <View
        pointerEvents="none"
        style={[styles.backdrop, { backgroundColor: cfg.accentSoft }]}
      />

      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <View style={styles.center}>
          {/* Hero plate */}
          <View style={styles.heroWrap}>
            <View
              style={[
                styles.heroPlate,
                {
                  shadowColor: cfg.accent,
                },
              ]}
            >
              <GameArt kind={cfg.art} accent={cfg.accent} width={204} height={144} />
            </View>
            <MotiView
              from={{ scale: 0.96, opacity: 0.35 }}
              animate={{ scale: 1.04, opacity: 0.6 }}
              transition={{
                type: "timing",
                duration: 1100,
                loop: true,
                repeatReverse: true,
              }}
              style={[styles.pulseRing, { borderColor: cfg.accent }]}
            />
          </View>

          {/* Title block */}
          <View style={{ alignItems: "center", marginTop: 36 }}>
            <View style={[styles.eyebrow, { backgroundColor: cfg.accentSoft }]}>
              <FireIcon color={cfg.accentInk} />
              <Text style={[styles.eyebrowText, { color: cfg.accentInk }]}>VAULT</Text>
            </View>
            <Text style={styles.title}>{cfg.name}</Text>
            <Text style={styles.tagline}>{cfg.tagline}</Text>
          </View>
        </View>

        {/* Progress + tip card */}
        <View style={styles.bottom}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardEyebrow}>LOADING</Text>
              <Text style={styles.cardPct}>{Math.floor(pct)}%</Text>
            </View>
            <View style={styles.track}>
              <View
                style={[
                  styles.trackFill,
                  { width: `${pct}%`, backgroundColor: cfg.accent },
                ]}
              />
            </View>
            <View style={styles.tipRow}>
              <View style={{ marginTop: 2 }}>
                <QuestionIcon color={cfg.accent} />
              </View>
              <MotiView
                key={tipIdx}
                from={{ opacity: 0, translateY: 4 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: "timing", duration: 320 }}
                style={{ flex: 1 }}
              >
                <Text style={styles.tipText}>
                  <Text style={styles.tipLead}>Tip · </Text>
                  {cfg.tips[tipIdx]}
                </Text>
              </MotiView>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
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

function QuestionIcon({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <Circle cx={8} cy={8} r={6.5} stroke={color} strokeWidth={1.6} />
      <Path
        d="M6.5 6.2C6.6 5.1 7.4 4.5 8.3 4.5c1 0 1.7.7 1.7 1.5 0 1.1-1 1.4-1.5 1.9-.3.3-.5.6-.5 1.1"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Circle cx={8} cy={11.5} r={0.8} fill={color} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: GT.bg },
  backdrop: {
    position: "absolute",
    top: -100,
    left: "50%",
    marginLeft: -260,
    width: 520,
    height: 420,
    borderRadius: 260,
    opacity: 0.85,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  heroWrap: {
    width: 240,
    height: 180,
    alignItems: "center",
    justifyContent: "center",
  },
  heroPlate: {
    width: 240,
    height: 180,
    borderRadius: 32,
    backgroundColor: "#FFFFFF",
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.05)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    padding: 18,
    shadowOpacity: 0.2,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 30 },
    elevation: 10,
  },
  pulseRing: {
    position: "absolute",
    top: -12,
    left: -12,
    right: -12,
    bottom: -12,
    borderRadius: 36,
    borderWidth: 1.5,
  },
  eyebrow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  eyebrowText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  title: {
    marginTop: 14,
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: -1,
    color: GT.ink,
  },
  tagline: {
    marginTop: 6,
    fontSize: 14,
    color: GT.muted,
  },
  bottom: { paddingHorizontal: 24, paddingBottom: 18 },
  card: {
    backgroundColor: GT.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.04)",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  cardEyebrow: {
    fontSize: 12,
    color: GT.muted,
    fontWeight: "600",
    letterSpacing: 0.4,
  },
  cardPct: {
    fontSize: 13,
    fontWeight: "800",
    color: GT.ink,
    fontVariant: ["tabular-nums"],
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(0,0,0,0.06)",
    overflow: "hidden",
  },
  trackFill: { height: "100%" },
  tipRow: {
    marginTop: 12,
    minHeight: 34,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  tipLead: { color: GT.muted, fontWeight: "600" },
  tipText: { fontSize: 13, color: GT.ink, lineHeight: 18 },
});
