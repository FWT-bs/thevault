import { useRouter } from "expo-router";
import { MotiView } from "moti";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
  Text as SvgText,
} from "react-native-svg";

import { streakClaim } from "../lib/streakClaim";

// Fullscreen daily-streak popup. 1:1 port of the design's
// streak-popup.jsx — same SVG flame paths, same gradients, same
// 4-keyframe coin arc.
//
// Three things this revision fixes vs. the previous attempt:
//   1. Coin animation uses RN Animated.sequence — works without any
//      worklet plugin.
//   2. The warm glow (and fire halo) are real react-native-svg
//      RadialGradients, not flat-color circles.
//   3. The reward block stacks with an explicit gap from the title
//      instead of `marginTop: 'auto'`, so the Continue button is
//      always above the home indicator.

const STREAK = 7;
const REWARD = 25;

// Coin choreography — matches the design's `sp-coin-fly` keyframes:
// 0% → 15% (330ms): rise + fade in
// 15% → 50% (770ms): peak + spin
// 50% → 100% (1100ms): siphon down toward the reward chip
const COIN_SEG_RISE = 330;
const COIN_SEG_PEAK = 770;
const COIN_SEG_FALL = 1100;
const COIN_FLY_DURATION = COIN_SEG_RISE + COIN_SEG_PEAK + COIN_SEG_FALL;
const COIN_BURST_DELAY = 600;
const COIN_BURST_SPACING = 140;
const COIN_TRICKLE_INTERVAL = 600;
const COIN_TRICKLE_DURATION = 6000;

type Coin = { id: number; xJitter: number; delay: number };

export default function StreakClaimRoute() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: winH, width: winW } = useWindowDimensions();
  const [displayAmount, setDisplayAmount] = useState(0);

  // Compute the coin landing zone deterministically from layout
  // numbers — saves us from running a measure pass and avoids
  // dropDistance flickering between renders. The fire core is at
  // viewBox y=195 of a 300pt wrapper, i.e. 65% down. The reward
  // chip sits at the bottom of the screen at a known offset.
  const fireWrapTop = insets.top + 40;
  const coinSourceY = fireWrapTop + 300 * 0.65;

  // Bottom block height tracks the styles below — caption + chip + cta
  // with a gap of 12 between siblings and an extra 28pt margin above
  // the cta so it sits clearly below the chip.
  const ctaH = 68;
  const chipH = 50;
  const chipToCtaGap = 12 + 28;
  const chipBottomFromScreenBottom =
    insets.bottom + 16 + ctaH + chipToCtaGap + chipH / 2;
  const chipCenterY = winH - chipBottomFromScreenBottom;
  const dropDistance = Math.max(280, chipCenterY - coinSourceY);

  // Count up the reward 0 → REWARD with a cubic ease-out — same curve
  // and 1.2s duration as the design.
  useEffect(() => {
    let raf: number | null = null;
    let cancelled = false;
    const start = Date.now();
    const dur = 1200;

    const tick = () => {
      if (cancelled) return;
      const t = Math.min(1, (Date.now() - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayAmount(Math.round(eased * REWARD));
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    const delay = setTimeout(() => {
      raf = requestAnimationFrame(tick);
    }, 700);

    return () => {
      cancelled = true;
      clearTimeout(delay);
      if (raf != null) cancelAnimationFrame(raf);
    };
  }, []);

  const onContinue = () => {
    streakClaim.setClaimed(true);
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)/home-tab");
  };

  return (
    <View style={[styles.root, { width: winW }]}>
      {/* Background warm-wash glow — real radial gradient, fills the
          full screen behind everything. */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient
              id="bgWash"
              cx="50%"
              cy="22%"
              rx="60%"
              ry="50%"
              fx="50%"
              fy="22%"
            >
              <Stop offset="0%" stopColor="#FF8C28" stopOpacity={0.35} />
              <Stop offset="35%" stopColor="#FF501E" stopOpacity={0.16} />
              <Stop offset="70%" stopColor="#000000" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect x={0} y={0} width="100%" height="100%" fill="url(#bgWash)" />
        </Svg>
      </View>

      {/* Subtle pulse on the wash to give it life */}
      <MotiView
        pointerEvents="none"
        from={{ opacity: 0.85 }}
        animate={{ opacity: 1 }}
        transition={{
          type: "timing",
          duration: 1800,
          loop: true,
          repeatReverse: true,
        }}
        style={[StyleSheet.absoluteFill]}
      >
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient
              id="bgWashPulse"
              cx="50%"
              cy="22%"
              rx="40%"
              ry="35%"
              fx="50%"
              fy="22%"
            >
              <Stop offset="0%" stopColor="#FFB35C" stopOpacity={0.28} />
              <Stop offset="100%" stopColor="#000000" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect x={0} y={0} width="100%" height="100%" fill="url(#bgWashPulse)" />
        </Svg>
      </MotiView>

      {/* Drifting embers — full-bleed, render under content */}
      <Embers screenHeight={winH} />

      <View
        style={[
          styles.content,
          {
            paddingTop: fireWrapTop,
            paddingBottom: insets.bottom + 16,
          },
        ]}
      >
        {/* Fire wrapper (240×300) */}
        <MotiView
          from={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 12, stiffness: 220 }}
          style={styles.fireWrap}
        >
          {/* Tight halo right around the fire — second SVG radial
              gradient, sized to the wrapper. */}
          <View style={styles.fireHalo} pointerEvents="none">
            <Svg width="100%" height="100%" viewBox="0 0 240 300">
              <Defs>
                <RadialGradient
                  id="fireHalo"
                  cx="50%"
                  cy="60%"
                  rx="65%"
                  ry="55%"
                  fx="50%"
                  fy="60%"
                >
                  <Stop offset="0%" stopColor="#FF8C28" stopOpacity={0.55} />
                  <Stop offset="35%" stopColor="#FF3C14" stopOpacity={0.25} />
                  <Stop offset="70%" stopColor="#000000" stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Rect x={-60} y={-30} width={360} height={360} fill="url(#fireHalo)" />
            </Svg>
          </View>

          {/* Three flame layers — each in its own MotiView so the
              transform can animate from the bottom (transformOrigin
              50% 90%) just like the design's CSS. */}
          <FlameLayer durationMs={1700} scaleY={1.05} scaleX={0.96} skew={-2}>
            <Svg width="100%" height="100%" viewBox="0 0 240 300">
              <Defs>
                <LinearGradient id="flameOuter" x1="0" y1="1" x2="0" y2="0">
                  <Stop offset="0%" stopColor="#FF3D00" />
                  <Stop offset="40%" stopColor="#FF6B1A" />
                  <Stop offset="80%" stopColor="#FFAA33" />
                  <Stop offset="100%" stopColor="#FFE066" stopOpacity={0.9} />
                </LinearGradient>
              </Defs>
              <Path
                d="M120 30 C 60 90 35 145 50 200 C 60 245 90 275 120 280 C 150 275 180 245 190 200 C 205 145 180 90 120 30 Z"
                fill="url(#flameOuter)"
              />
            </Svg>
          </FlameLayer>

          <FlameLayer durationMs={1300} scaleY={1.07} scaleX={0.94} translateX={2}>
            <Svg width="100%" height="100%" viewBox="0 0 240 300">
              <Defs>
                <LinearGradient id="flameMid" x1="0" y1="1" x2="0" y2="0">
                  <Stop offset="0%" stopColor="#FF8A3D" />
                  <Stop offset="60%" stopColor="#FFC247" />
                  <Stop offset="100%" stopColor="#FFEB99" />
                </LinearGradient>
              </Defs>
              <Path
                d="M120 70 C 80 115 65 160 78 205 C 88 240 105 265 120 268 C 135 265 152 240 162 205 C 175 160 160 115 120 70 Z"
                fill="url(#flameMid)"
              />
            </Svg>
          </FlameLayer>

          <FlameLayer durationMs={900} scaleY={1.12} scaleX={0.9} fadeTo={0.85}>
            <Svg width="100%" height="100%" viewBox="0 0 240 300">
              <Defs>
                <LinearGradient id="flameInner" x1="0" y1="1" x2="0" y2="0">
                  <Stop offset="0%" stopColor="#FFD180" />
                  <Stop offset="100%" stopColor="#FFF6D6" />
                </LinearGradient>
              </Defs>
              <Path
                d="M120 110 C 95 145 88 180 98 215 C 105 240 113 255 120 256 C 127 255 135 240 142 215 C 152 180 145 145 120 110 Z"
                fill="url(#flameInner)"
              />
            </Svg>
          </FlameLayer>

          {/* White-hot core glow on top of all flame layers */}
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <Svg width="100%" height="100%" viewBox="0 0 240 300">
              <Defs>
                <RadialGradient
                  id="coreGlow"
                  cx="50%"
                  cy="55%"
                  rx="50%"
                  ry="50%"
                  fx="50%"
                  fy="55%"
                >
                  <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.95} />
                  <Stop offset="60%" stopColor="#FFE7A8" stopOpacity={0.6} />
                  <Stop offset="100%" stopColor="#FFB347" stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Ellipse cx={120} cy={195} rx={58} ry={68} fill="url(#coreGlow)" />
            </Svg>
          </View>

          {/* Day eyebrow + giant streak number */}
          <View style={styles.fireCenter} pointerEvents="none">
            <Text style={styles.dayLabel}>DAY</Text>
            <MotiView
              from={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: "spring",
                damping: 12,
                stiffness: 260,
                delay: 200,
              }}
            >
              <Text style={styles.streakNumber}>{STREAK}</Text>
            </MotiView>
          </View>

          {/* Coins emerge from the fire core (65% down the wrapper)
              and arc toward the reward chip below. */}
          <CoinFountain dropDistance={dropDistance} />
        </MotiView>

        {/* Title + subtitle */}
        <MotiView
          from={{ opacity: 0, translateY: 14 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 700, delay: 300 }}
          style={styles.copy}
        >
          <Text style={styles.title}>Congratulations!</Text>
          <Text style={styles.subtitle}>You're on a {STREAK}-day streak</Text>
        </MotiView>

        {/* Reward + CTA — explicit gap above, no `marginTop: auto`,
            so the CTA stays well clear of the home indicator on all
            iPhone sizes. */}
        <MotiView
          from={{ opacity: 0, translateY: 14 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 700, delay: 500 }}
          style={styles.bottom}
        >
          <Text style={styles.rewardCaption}>STREAK BONUS REWARD</Text>
          <View style={styles.rewardChip}>
            <Coin size={22} />
            <Text style={styles.rewardAmount}>+{displayAmount} CR</Text>
          </View>

          <Pressable
            onPress={onContinue}
            style={({ pressed }) => [styles.cta, pressed ? styles.ctaPressed : null]}
          >
            <Text style={styles.ctaLabel}>Continue</Text>
          </Pressable>
        </MotiView>
      </View>
    </View>
  );
}

// ── Flame layer ────────────────────────────────────────────────────
// Animates its View transform with the same skew/scale rhythm as the
// design's `sp-flame-*` keyframes. transformOrigin "50% 90%" anchors
// the flex point at the base of the flame so the silhouette licks
// upward, not from its center.

function FlameLayer({
  durationMs,
  scaleY,
  scaleX,
  skew = 0,
  translateX = 0,
  fadeTo,
  children,
}: {
  durationMs: number;
  scaleY: number;
  scaleX: number;
  skew?: number;
  translateX?: number;
  fadeTo?: number;
  children: React.ReactNode;
}) {
  return (
    <MotiView
      from={{
        scaleY: 1,
        scaleX: 1,
        skewX: "0deg",
        translateX: 0,
        opacity: 1,
      }}
      animate={{
        scaleY,
        scaleX,
        skewX: `${skew}deg`,
        translateX,
        opacity: fadeTo ?? 1,
      }}
      transition={{
        type: "timing",
        duration: durationMs,
        loop: true,
        repeatReverse: true,
      }}
      style={[StyleSheet.absoluteFill, { transformOrigin: "50% 90%" }]}
    >
      {children}
    </MotiView>
  );
}

// ── Embers ────────────────────────────────────────────────────────

function Embers({ screenHeight }: { screenHeight: number }) {
  const embers = useRef(
    Array.from({ length: 18 }).map((_, i) => ({
      key: `ember-${i}`,
      leftPct: (i * 53 + 17) % 100,
      size: 3 + (i % 3),
      color: i % 3 === 0 ? "#FFD27A" : i % 3 === 1 ? "#FF8B3A" : "#FF5A2A",
      duration: (5 + (i % 5)) * 1000,
      delay: ((i * 0.4) % 4) * 1000,
    })),
  ).current;

  return (
    <View pointerEvents="none" style={styles.emberWrap}>
      {embers.map((e) => (
        <MotiView
          key={e.key}
          from={{ translateY: 0, translateX: 0, opacity: 0, scale: 1 }}
          animate={{
            translateY: -screenHeight - 50,
            translateX: 20,
            opacity: 0,
            scale: 0.4,
          }}
          transition={{
            type: "timing",
            duration: e.duration,
            delay: e.delay,
            loop: true,
            repeatReverse: false,
          }}
          style={[
            styles.ember,
            {
              left: `${e.leftPct}%`,
              width: e.size,
              height: e.size,
              backgroundColor: e.color,
              shadowColor: e.color,
            },
          ]}
        />
      ))}
    </View>
  );
}

// ── Coin fountain ─────────────────────────────────────────────────

function CoinFountain({ dropDistance }: { dropDistance: number }) {
  const [coins, setCoins] = useState<Coin[]>([]);
  const idRef = useRef(0);

  useEffect(() => {
    let mounted = true;

    const spawn = () => {
      if (!mounted) return;
      const id = ++idRef.current;
      const xJitter = (Math.random() - 0.5) * 80;
      const delay = Math.random() * 200;
      setCoins((prev) => [...prev, { id, xJitter, delay }]);
      setTimeout(() => {
        if (!mounted) return;
        setCoins((prev) => prev.filter((c) => c.id !== id));
      }, COIN_FLY_DURATION + delay + 100);
    };

    const start = setTimeout(() => {
      // Burst of 6 coins
      for (let i = 0; i < 6; i++) {
        setTimeout(spawn, i * COIN_BURST_SPACING);
      }
      // Slow trickle for ~6s
      const trickle = setInterval(spawn, COIN_TRICKLE_INTERVAL);
      setTimeout(() => clearInterval(trickle), COIN_TRICKLE_DURATION);
    }, COIN_BURST_DELAY);

    return () => {
      mounted = false;
      clearTimeout(start);
    };
  }, []);

  return (
    <View pointerEvents="none" style={styles.coinSource}>
      {coins.map((c) => (
        <FlyingCoin
          key={c.id}
          xJitter={c.xJitter}
          delay={c.delay}
          dropDistance={dropDistance}
        />
      ))}
    </View>
  );
}

// ── Flying coin — plain RN Animated, no Reanimated worklets ───────

function FlyingCoin({
  xJitter,
  delay,
  dropDistance,
}: {
  xJitter: number;
  delay: number;
  dropDistance: number;
}) {
  const tx = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(0)).current;
  const sc = useRef(new Animated.Value(0.4)).current;
  const op = useRef(new Animated.Value(0)).current;
  // rot is animated as a 0-1 driver and interpolated to degrees so it
  // can ride the native driver alongside the rest.
  const rot = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const ease = Easing.bezier(0.4, 0.1, 0.6, 1);
    const t = (
      value: Animated.Value,
      toValue: number,
      duration: number,
    ): Animated.CompositeAnimation =>
      Animated.timing(value, {
        toValue,
        duration,
        easing: ease,
        useNativeDriver: true,
      });

    const sequence = Animated.sequence([
      Animated.delay(delay),
      // Segment 1 — rise + fade in (330ms)
      Animated.parallel([
        t(tx, xJitter * 0.4, COIN_SEG_RISE),
        t(ty, -30, COIN_SEG_RISE),
        t(sc, 0.9, COIN_SEG_RISE),
        t(op, 1, COIN_SEG_RISE),
        t(rot, 60 / 720, COIN_SEG_RISE),
      ]),
      // Segment 2 — peak + spin (770ms)
      Animated.parallel([
        t(tx, xJitter, COIN_SEG_PEAK),
        t(ty, -90, COIN_SEG_PEAK),
        t(sc, 1.1, COIN_SEG_PEAK),
        t(rot, 220 / 720, COIN_SEG_PEAK),
      ]),
      // Segment 3 — siphon down to chip (1100ms)
      Animated.parallel([
        t(tx, 0, COIN_SEG_FALL),
        t(ty, dropDistance, COIN_SEG_FALL),
        t(sc, 0.7, COIN_SEG_FALL),
        t(op, 0, COIN_SEG_FALL),
        t(rot, 1, COIN_SEG_FALL),
      ]),
    ]);

    sequence.start();
    return () => {
      sequence.stop();
    };
  }, [delay, dropDistance, xJitter, op, rot, sc, ty, tx]);

  const rotateDeg = rot.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "720deg"],
  });

  return (
    <Animated.View
      style={[
        styles.flyingCoin,
        {
          opacity: op,
          transform: [
            { translateX: tx },
            { translateY: ty },
            { scale: sc },
            { rotate: rotateDeg },
          ],
        },
      ]}
    >
      <Coin size={28} />
    </Animated.View>
  );
}

// ── Coin SVG ──────────────────────────────────────────────────────

function Coin({ size }: { size: number }) {
  // Each Coin gets its own gradient id so multiple coins on screen
  // don't share a single defs reference.
  const id = useRef(`coinFace-${Math.random().toString(36).slice(2)}`).current;
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28">
      <Defs>
        <RadialGradient id={id} cx="40%" cy="35%" rx="70%" ry="70%" fx="40%" fy="35%">
          <Stop offset="0%" stopColor="#FFF6C7" />
          <Stop offset="50%" stopColor="#FFD24A" />
          <Stop offset="100%" stopColor="#E89200" />
        </RadialGradient>
      </Defs>
      <Circle cx={14} cy={14} r={13} fill="#B86E00" />
      <Circle cx={14} cy={14} r={11.5} fill={`url(#${id})`} />
      <Circle
        cx={14}
        cy={14}
        r={9.5}
        fill="none"
        stroke="#B86E00"
        strokeWidth={0.8}
        opacity={0.5}
      />
      <SvgText
        x={14}
        y={18}
        textAnchor="middle"
        fontSize={11}
        fontWeight="900"
        fill="#8B4D00"
      >
        $
      </SvgText>
      <Ellipse cx={10} cy={9} rx={2.5} ry={1.4} fill="#FFFBEA" opacity={0.7} />
    </Svg>
  );
}

// ── Styles ───────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0A0A0C",
    overflow: "hidden",
  },

  emberWrap: { ...StyleSheet.absoluteFillObject, overflow: "hidden" },
  ember: {
    position: "absolute",
    bottom: -10,
    borderRadius: 4,
    opacity: 0.7,
    shadowOpacity: 0.7,
    shadowRadius: 6,
  },

  content: {
    flex: 1,
    alignItems: "center",
    flexDirection: "column",
  },

  fireWrap: {
    width: 240,
    height: 300,
  },
  fireHalo: {
    position: "absolute",
    left: -60,
    right: -60,
    top: -30,
    bottom: -10,
  },
  fireCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2.4,
    color: "rgba(80,30,0,0.7)",
  },
  streakNumber: {
    fontSize: 120,
    fontWeight: "900",
    lineHeight: 120,
    color: "#FFFAEC",
    letterSpacing: -4,
    textShadowColor: "rgba(255,200,80,0.9)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 24,
    fontVariant: ["tabular-nums"],
  },

  // Coin source pin sits at fire viewBox y=195 (65% of 300) → top:65%.
  // Children render from this point; transforms move them from there.
  coinSource: {
    position: "absolute",
    left: "50%",
    top: "65%",
    width: 0,
    height: 0,
  },
  flyingCoin: {
    position: "absolute",
    left: -14,
    top: -14,
  },

  copy: {
    marginTop: 18,
    paddingHorizontal: 30,
    alignItems: "center",
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -1,
    textAlign: "center",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    lineHeight: 21,
  },

  bottom: {
    marginTop: 28,
    width: "100%",
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 12,
  },
  rewardCaption: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
    color: "rgba(255,200,120,0.85)",
  },
  rewardChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 24,
    backgroundColor: "rgba(255,150,55,0.16)",
    borderWidth: 0.5,
    borderColor: "rgba(255,180,80,0.35)",
    shadowColor: "#FF8C28",
    shadowOpacity: 0.4,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 8 },
  },
  rewardAmount: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFE6B0",
    letterSpacing: -0.5,
    fontVariant: ["tabular-nums"],
  },

  cta: {
    alignSelf: "stretch",
    minHeight: 68,
    paddingVertical: 18,
    marginTop: 28,
    borderRadius: 34,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FFFFFF",
    shadowOpacity: 0.45,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 14 },
    elevation: 6,
  },
  ctaPressed: { opacity: 0.85 },
  ctaLabel: {
    fontSize: 19,
    fontWeight: "800",
    color: "#0A0A0C",
    letterSpacing: -0.3,
  },
});
