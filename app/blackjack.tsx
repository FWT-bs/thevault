import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import { MotiView } from "moti";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LiquidGlassButton } from "../components/LiquidGlassButton";
import { GLASS } from "../constants/glassPalette";
import { typography } from "../constants/typography";

const SPINNER = require("../assets/Loading spinner simplui.json");

const GUTTER = 24;
const AD_MS = 90_000;
const AD_SECS = 5;
const START_COINS = 1_200;

// ─── Colors ───────────────────────────────────────────────────────────────────
const DARK_BG = "#0B1729";
const FELT_BG = "#091C10";
const FELT_SURFACE = "#0D2416";
const CARD_BG = "#FDFBF6";
const GOLD = "#F6D98A";
const WIN_GREEN = "#22C55E";
const LOSE_RED = "#DC2626";
const PUSH_BLUE = "#60A5FA";
const BJ_GOLD = "#F59E0B";

// ─── Types ────────────────────────────────────────────────────────────────────
type Suit = "♥" | "♦" | "♣" | "♠";
type Rank = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K";
type Phase = "loading" | "landing" | "playing";
type GameState = "idle" | "player" | "dealer" | "done";
type Outcome = "blackjack" | "win" | "push" | "lose" | "bust" | null;

interface Card { suit: Suit; rank: Rank; hidden?: boolean; id: string }

// ─── Helpers ──────────────────────────────────────────────────────────────────
function freshDeck(): Card[] {
  const suits: Suit[] = ["♥", "♦", "♣", "♠"];
  const ranks: Rank[] = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
  const deck: Card[] = [];
  let n = 0;
  for (const s of suits) for (const r of ranks) deck.push({ suit: s, rank: r, id: `${s}${r}${n++}` });
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function handTotals(hand: Card[]): [number, number] {
  let soft = 0;
  let aces = 0;
  for (const c of hand) {
    if (c.hidden) continue;
    if (c.rank === "A") {
      soft += 11;
      aces += 1;
      continue;
    }
    if (["J", "Q", "K"].includes(c.rank)) {
      soft += 10;
      continue;
    }
    const value = parseInt(c.rank, 10);
    soft += value;
  }
  const hard = soft - aces * 10;
  return [hard, soft];
}

function handScore(hand: Card[]): number {
  const [hard, soft] = handTotals(hand);
  if (soft <= 21) return soft;
  return hard;
}

function isBust(hand: Card[]): boolean {
  const [hard] = handTotals(hand);
  return hard > 21;
}

function isBlackjack(hand: Card[]): boolean {
  return hand.length === 2 && handScore(hand) === 21;
}

const isRed = (s: Suit) => s === "♥" || s === "♦";

// Runs dealer AI outside React to avoid stale closures
function runDealer(
  hand: Card[], deck: Card[],
  onCard: (h: Card[], d: Card[]) => void,
  onDone: (finalScore: number) => void,
) {
  function step(h: Card[], d: Card[]) {
    const s = handScore(h);
    if (s >= 17) { setTimeout(() => onDone(s), 500); return; }
    setTimeout(() => {
      const [card, ...rest] = d;
      const next = [...h, card];
      onCard(next, rest);
      step(next, rest);
    }, 780);
  }
  setTimeout(() => step(hand, deck), 450);
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function BlackjackGame() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [coins, setCoins] = useState(START_COINS);
  const [winStreak, setWinStreak] = useState(4);
  const [handsWon, setHandsWon] = useState(23);
  const [handsPlayed, setHandsPlayed] = useState(47);
  const [adVisible, setAdVisible] = useState(false);
  const adRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setPhase("landing"), 1_800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (phase !== "playing") { adRef.current && clearInterval(adRef.current); return; }
    adRef.current = setInterval(() => setAdVisible(true), AD_MS);
    return () => { adRef.current && clearInterval(adRef.current); };
  }, [phase]);

  if (phase === "loading") return <LoadingScreen />;
  if (phase === "landing") {
    return (
      <LandingPage
        coins={coins} winStreak={winStreak} handsWon={handsWon} handsPlayed={handsPlayed}
        onPlay={() => setPhase("playing")}
        onBack={() => {
          if (router.canGoBack()) router.back();
          else router.replace("/games-in-app");
        }}
      />
    );
  }
  return (
    <GameplayScreen
      coins={coins} setCoins={setCoins}
      winStreak={winStreak} setWinStreak={setWinStreak}
      handsWon={handsWon} setHandsWon={setHandsWon}
      handsPlayed={handsPlayed} setHandsPlayed={setHandsPlayed}
      adVisible={adVisible} onAdDone={() => setAdVisible(false)}
      onQuit={() => setPhase("landing")}
    />
  );
}

// ─── Loading ──────────────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <View style={styles.loadingRoot}>
      <MotiView
        from={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", damping: 20, stiffness: 240 }}
        style={styles.loadingInner}
      >
        <LogoMark size="small" />
        <LottieView source={SPINNER} autoPlay loop style={{ width: 52, height: 52, marginTop: 24 }} />
        <Text style={styles.loadingLabel}>BLACKJACK</Text>
      </MotiView>
    </View>
  );
}

// ─── Landing ──────────────────────────────────────────────────────────────────
interface LandingProps {
  coins: number; winStreak: number; handsWon: number; handsPlayed: number;
  onPlay: () => void; onBack: () => void;
}

function LandingPage({ coins, onPlay, onBack }: LandingProps) {
  return (
    <View style={styles.landingRoot}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <ScrollView
          contentContainerStyle={styles.landingScroll}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Band 1: Resource + Utility Header ── */}
          <MotiView
            from={{ opacity: 0, translateY: -10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 400 }}
            style={styles.headerBand}
          >
            <View style={styles.utilRow}>
              <Pressable onPress={onBack} hitSlop={8} style={styles.utilBtn}>
                <Ionicons name="chevron-back" size={18} color={GOLD} />
              </Pressable>
              <Pressable hitSlop={8} style={styles.utilBtn}>
                <Ionicons name="settings-outline" size={17} color="rgba(246,217,138,0.7)" />
              </Pressable>
            </View>
            <View style={styles.resourceRow}>
              <View style={[styles.resourcePill, styles.resourcePillGold]}>
                <Text style={styles.resourceIcon}>💰</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.resourceValue, { color: GOLD }]}>{coins.toLocaleString()}</Text>
                  <Text style={styles.resourceSub}>coins</Text>
                </View>
                <Pressable style={styles.resourceAdd} hitSlop={6}>
                  <Ionicons name="add" size={14} color={GOLD} />
                </Pressable>
              </View>
              <View style={[styles.resourcePill, styles.resourcePillGem]}>
                <Text style={styles.resourceIcon}>💎</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.resourceValue, { color: GLASS.cobaltLight }]}>8</Text>
                  <Text style={styles.resourceSub}>gems</Text>
                </View>
                <Pressable style={[styles.resourceAdd, { borderColor: "rgba(186,230,253,0.3)" }]} hitSlop={6}>
                  <Ionicons name="add" size={14} color={GLASS.cobaltLight} />
                </Pressable>
              </View>
            </View>
          </MotiView>

          {/* ── Band 2: Hero block ── */}
          <MotiView
            from={{ opacity: 0, translateY: 16 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "spring", delay: 120, damping: 22, stiffness: 280 }}
            style={styles.heroBand}
          >
            <LogoMark size="large" />
            <Text style={styles.heroTitle}>BLACKJACK</Text>
            <Text style={styles.heroSub}>Beat the dealer. Win big.</Text>
          </MotiView>

          {/* ── Band 3: Action ── */}
          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", delay: 240, damping: 22, stiffness: 260 }}
            style={styles.actionBand}
          >
            <LiquidGlassButton
              label="Deal Me In"
              systemImage="suit.spade.fill"
              size="large"
              tone="cobalt"
              variant="glassProminent"
              fullWidth
              onPress={onPlay}
            />
          </MotiView>

          {/* ── Band 4: Footer — 4 round icon buttons, no labels, no container ── */}
          <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", delay: 360, duration: 320 }}
            style={styles.footerBand}
          >
            <RoundIconBtn icon="chart-bar" />
            <RoundIconBtn icon="flag-checkered" />
            <RoundIconBtn icon="storefront-outline" />
            <RoundIconBtn icon="trophy-outline" />
          </MotiView>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function RoundIconBtn({ icon }: { icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"] }) {
  return (
    <Pressable
      hitSlop={8}
      style={({ pressed }) => [styles.roundIconBtn, pressed && { opacity: 0.65, transform: [{ scale: 0.93 }] }]}
    >
      <MaterialCommunityIcons name={icon} size={22} color={GOLD} />
    </Pressable>
  );
}

// ─── Logo mark ────────────────────────────────────────────────────────────────
function LogoMark({ size }: { size: "small" | "large" }) {
  const s = size === "large";
  const W = s ? 180 : 100;
  const H = s ? 140 : 78;
  const cW = s ? 86 : 48;
  const cH = s ? 118 : 66;
  const fontSize = s ? 36 : 20;
  const cornerSize = s ? 13 : 7;

  return (
    <View style={{ width: W, height: H, alignItems: "center", justifyContent: "center" }}>
      {/* Left: Ace of Hearts */}
      <View style={[styles.logoCard, { width: cW, height: cH, position: "absolute", left: 0, top: s ? 16 : 8,
        transform: [{ rotate: "-13deg" }], backgroundColor: CARD_BG }]}>
        <Text style={{ fontSize: cornerSize, color: LOSE_RED, ...typography.bold }}>A</Text>
        <Text style={{ fontSize, color: LOSE_RED, lineHeight: fontSize * 1.1 }}>♥</Text>
      </View>
      {/* Right: King of Diamonds */}
      <View style={[styles.logoCard, { width: cW, height: cH, position: "absolute", right: 0, top: s ? 16 : 8,
        transform: [{ rotate: "13deg" }], backgroundColor: CARD_BG }]}>
        <Text style={{ fontSize: cornerSize, color: LOSE_RED, ...typography.bold }}>K</Text>
        <Text style={{ fontSize, color: LOSE_RED, lineHeight: fontSize * 1.1 }}>♦</Text>
      </View>
      {/* Front: Ace of Spades */}
      <View style={[styles.logoCard, styles.logoCardMain, { width: cW, height: cH, backgroundColor: CARD_BG, zIndex: 3 }]}>
        <Text style={{ fontSize: cornerSize, color: "#1A1A1F", ...typography.bold }}>A</Text>
        <Text style={{ fontSize, color: "#1A1A1F", lineHeight: fontSize * 1.1 }}>♠</Text>
      </View>
    </View>
  );
}

// ─── Gameplay ─────────────────────────────────────────────────────────────────
interface GameplayProps {
  coins: number; setCoins: React.Dispatch<React.SetStateAction<number>>;
  winStreak: number; setWinStreak: React.Dispatch<React.SetStateAction<number>>;
  handsWon: number; setHandsWon: React.Dispatch<React.SetStateAction<number>>;
  handsPlayed: number; setHandsPlayed: React.Dispatch<React.SetStateAction<number>>;
  adVisible: boolean; onAdDone: () => void; onQuit: () => void;
}

const CHIPS = [
  { value: 10, color: "#A9E5FF", dark: "#0EA5E9" },
  { value: 25, color: "#FFB389", dark: "#C2410C" },
  { value: 50, color: "#9FE2B5", dark: "#16A34A" },
  { value: 100, color: GOLD, dark: "#92400E" },
];

function GameplayScreen({
  coins, setCoins, winStreak, setWinStreak,
  handsWon, setHandsWon, handsPlayed, setHandsPlayed,
  adVisible, onAdDone, onQuit,
}: GameplayProps) {
  const [deck, setDeck] = useState<Card[]>(() => freshDeck());
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [betStack, setBetStack] = useState<number[]>([]);
  const [activeBet, setActiveBet] = useState(25);
  const [gameState, setGameState] = useState<GameState>("idle");
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [chipAnimKey, setChipAnimKey] = useState(0);

  const pScore = handScore(playerHand);
  const dScore = handScore(dealerHand);
  const currentBet = betStack.reduce((sum, value) => sum + value, 0);

  const deal = useCallback(() => {
    if (currentBet <= 0) return;
    if (coins < currentBet) return;
    const d = deck.length < 15 ? freshDeck() : deck;
    const [p1, d1, p2, d2, ...rest] = d;
    const ph: Card[] = [p1, p2];
    const dh: Card[] = [d1, { ...d2, hidden: true }];

    setDeck(rest);
    setPlayerHand(ph);
    setDealerHand(dh);
    setActiveBet(currentBet);
    setOutcome(null);
    setCoins(c => c - currentBet);

    // Immediate blackjack check (use raw values before hiding)
    const pBJ = isBlackjack(ph);
    const dBJ = isBlackjack([d1, d2]);

    if (pBJ) {
      setTimeout(() => {
        setDealerHand([d1, { ...d2, hidden: false }]);
        setTimeout(() => {
          if (dBJ) {
            setCoins(c => c + currentBet);
            setOutcome("push");
          } else {
            setCoins(c => c + Math.round(currentBet * 2.5));
            setOutcome("blackjack");
            setHandsWon(n => n + 1);
            setWinStreak(n => n + 1);
          }
          setHandsPlayed(n => n + 1);
          setGameState("done");
        }, 600);
      }, 900);
      setGameState("dealer");
    } else {
      setGameState("player");
    }
  }, [coins, currentBet, deck]);

  const addChip = useCallback(
    (chipValue: number) => {
      if (gameState !== "idle") return;
      if (currentBet + chipValue > coins) return;
      setBetStack((stack) => [...stack, chipValue]);
      setChipAnimKey((k) => k + 1);
    },
    [coins, currentBet, gameState],
  );

  const clearBet = useCallback(() => {
    if (gameState !== "idle") return;
    setBetStack([]);
  }, [gameState]);

  const hit = useCallback(() => {
    if (gameState !== "player") return;
    const [card, ...rest] = deck;
    const newHand = [...playerHand, card];
    setDeck(rest);
    setPlayerHand(newHand);
    const s = handScore(newHand);
    if (isBust(newHand)) {
      setGameState("done");
      setOutcome("bust");
      setHandsPlayed(n => n + 1);
      setWinStreak(0);
    } else if (s === 21) {
      triggerDealerTurn(newHand, rest, activeBet);
    }
  }, [gameState, deck, playerHand, activeBet]);

  const stand = useCallback(() => {
    if (gameState !== "player") return;
    triggerDealerTurn(playerHand, deck, activeBet);
  }, [gameState, playerHand, deck, activeBet]);

  const doubleDown = useCallback(() => {
    if (gameState !== "player" || playerHand.length !== 2 || coins < activeBet) return;
    const [card, ...rest] = deck;
    const newHand = [...playerHand, card];
    const newBet = activeBet * 2;
    setDeck(rest);
    setPlayerHand(newHand);
    setCoins(c => c - activeBet);
    setActiveBet(newBet);
    const s = handScore(newHand);
    if (isBust(newHand)) {
      setGameState("done");
      setOutcome("bust");
      setHandsPlayed(n => n + 1);
      setWinStreak(0);
    } else {
      triggerDealerTurn(newHand, rest, newBet);
    }
  }, [gameState, playerHand, deck, activeBet, coins]);

  function triggerDealerTurn(pHand: Card[], currentDeck: Card[], currentBet: number) {
    setGameState("dealer");
    const revealed = dealerHand.map(c => ({ ...c, hidden: false }));
    setDealerHand(revealed);
    const pFinal = handScore(pHand);

    runDealer(
      revealed,
      currentDeck,
      (newHand, newDeck) => { setDealerHand(newHand); setDeck(newDeck); },
      (dFinal) => {
        setHandsPlayed(n => n + 1);
        setGameState("done");
        if (dFinal > 21 || pFinal > dFinal) {
          setCoins(c => c + currentBet * 2);
          setOutcome("win");
          setHandsWon(n => n + 1);
          setWinStreak(n => n + 1);
        } else if (dFinal > pFinal) {
          setOutcome("lose");
          setWinStreak(0);
        } else {
          setCoins(c => c + currentBet);
          setOutcome("push");
        }
      },
    );
  }

  const newHand = useCallback(() => {
    setPlayerHand([]);
    setDealerHand([]);
    setOutcome(null);
    setGameState("idle");
  }, []);

  return (
    <View style={styles.gameRoot}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        {/* ── Top bar ── */}
        <View style={styles.gameTopBar}>
          <Pressable onPress={onQuit} style={styles.quitBtn} hitSlop={8}>
            <Ionicons name="close" size={18} color="rgba(255,255,255,0.7)" />
            <Text style={styles.quitLabel}>Quit</Text>
          </Pressable>
          <View style={styles.gameCoinsChip}>
            <Text style={styles.gameCoinsIcon}>💰</Text>
            <Text style={styles.gameCoinVal}>{coins.toLocaleString()}</Text>
          </View>
        </View>

        {/* ── Dealer zone ── */}
        <View style={styles.dealerZone}>
          <View style={styles.zoneHeader}>
            <Text style={styles.zoneLabel}>DEALER</Text>
            {dealerHand.length > 0 && (
              <MotiView
                from={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", damping: 18 }}
              >
                <View style={[styles.scoreTag,
                  gameState === "done" && dScore > 21 && { backgroundColor: LOSE_RED },
                ]}>
                  <Text style={styles.scoreTagText}>
                    {gameState === "player" ? `${handScore(dealerHand.filter(c => !c.hidden))}` : `${dScore}`}
                  </Text>
                </View>
              </MotiView>
            )}
          </View>
          <HandDisplay cards={dealerHand} />
        </View>

        {/* ── Felt middle: bet controls ── */}
        <View style={styles.feltMiddle}>
          <View style={styles.betArea}>
            <View style={styles.activeBetChip}>
              <Text style={styles.activeBetLabel}>CURRENT BET</Text>
              <Text style={styles.activeBetVal}>{gameState === "idle" ? currentBet : activeBet}</Text>
            </View>
          </View>
        </View>

        {/* ── Player zone ── */}
        <View style={styles.playerZone}>
          <HandDisplay cards={playerHand} />
          <View style={styles.zoneHeader}>
            <Text style={styles.zoneLabel}>YOU</Text>
            {playerHand.length > 0 && (
              <MotiView
                from={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", damping: 18 }}
              >
                <View style={[styles.scoreTag,
                  pScore > 21 && { backgroundColor: LOSE_RED },
                  pScore === 21 && playerHand.length === 2 && { backgroundColor: BJ_GOLD },
                ]}>
                  <Text style={styles.scoreTagText}>{pScore || ""}</Text>
                </View>
              </MotiView>
            )}
          </View>
        </View>

        {/* ── Action buttons ── */}
        <View style={styles.actionBar}>
          {gameState === "idle" ? (
            <View style={styles.idleActionWrap}>
              <View
                style={[
                  styles.dealActionOutline,
                  (coins < currentBet || currentBet <= 0) && styles.dealActionOutlineDisabled,
                ]}
              >
                <Pressable
                  onPress={deal}
                  disabled={coins < currentBet || currentBet <= 0}
                  style={({ pressed }) => [
                    styles.dealActionButton,
                    coins < currentBet || currentBet <= 0 ? styles.dealActionButtonDisabled : styles.dealActionButtonActive,
                    pressed && (coins >= currentBet && currentBet > 0) ? { opacity: 0.92 } : null,
                  ]}
                >
                  <View pointerEvents="none" style={styles.dealActionContent}>
                    <Text style={[styles.dealActionText, coins < currentBet || currentBet <= 0 ? { color: "rgba(0,0,0,0.4)" } : null]}>
                      Deal
                    </Text>
                    <Ionicons
                      name="diamond"
                      size={12}
                      color={coins < currentBet || currentBet <= 0 ? "rgba(0,0,0,0.4)" : "#000000"}
                    />
                  </View>
                </Pressable>
              </View>
            </View>
          ) : gameState === "player" ? (
            <View style={styles.gameActions}>
              <View style={styles.actionBtn}>
                <LiquidGlassButton label="Hit" systemImage="plus" size="small" tone="cobalt" variant="glassProminent" fullWidth onPress={hit} />
              </View>
              <View style={styles.actionBtn}>
                <LiquidGlassButton label="Stand" systemImage="hand.raised.fill" size="small" tone="copper" variant="glassProminent" fullWidth onPress={stand} />
              </View>
              <View style={styles.actionBtn}>
                <LiquidGlassButton
                  label="2×"
                  systemImage="arrow.up.circle.fill"
                  size="small"
                  tone="ink"
                  variant="glassProminent"
                  fullWidth
                  onPress={doubleDown}
                  disabled={playerHand.length !== 2 || coins < activeBet}
                />
              </View>
            </View>
          ) : (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <Text style={styles.dealerPlayingText}>
                {gameState === "dealer" ? "Dealer playing…" : ""}
              </Text>
            </View>
          )}
        </View>

        {gameState === "idle" ? (
          <View style={styles.chipTray}>
            <View style={styles.chipTrayRow}>
              {CHIPS.map((chip) => {
                const disabled = currentBet + chip.value > coins;
                return (
                  <Pressable
                    key={chip.value}
                    disabled={disabled}
                    onPress={() => addChip(chip.value)}
                    style={({ pressed }) => [
                      styles.chip,
                      { backgroundColor: chip.color, borderColor: chip.dark },
                      disabled && { opacity: 0.45 },
                      pressed && !disabled && { transform: [{ scale: 0.93 }] },
                    ]}
                  >
                    <Text style={[styles.chipLabel, { color: chip.dark }]}>{chip.value}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.trayBottomRow}>
              <Pressable
                onPress={clearBet}
                disabled={betStack.length === 0}
                style={({ pressed }) => [
                  styles.clearBetBtn,
                  betStack.length === 0 && { opacity: 0.45 },
                  pressed && betStack.length > 0 && { opacity: 0.8 },
                ]}
              >
                <Text style={styles.clearBetText}>Clear</Text>
              </Pressable>

              <MotiView
                key={chipAnimKey}
                from={{ opacity: 0.6, translateY: 8 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: "timing", duration: 220 }}
                style={styles.chipStackPreview}
              >
                {betStack.length === 0 ? (
                  <Text style={styles.inlineStakeHint}>Add chips below to set your bet</Text>
                ) : (
                  <>
                    {betStack.slice(-5).map((value, i) => {
                      const def = CHIPS.find((c) => c.value === value) ?? CHIPS[0];
                      return (
                        <View
                          key={`${value}-${i}`}
                          style={[
                            styles.stakeChip,
                            styles.stackChip,
                            {
                              backgroundColor: def.color,
                              borderColor: def.dark,
                              marginLeft: i === 0 ? 0 : -16,
                              zIndex: i + 1,
                            },
                          ]}
                        >
                          <Text style={[styles.stakeChipLabel, { color: def.dark }]}>{value}</Text>
                        </View>
                      );
                    })}
                  </>
                )}
              </MotiView>
            </View>
          </View>
        ) : null}
      </SafeAreaView>

      {/* ── Outcome overlay ── */}
      {outcome !== null && gameState === "done" ? (
        <ResultOverlay outcome={outcome} bet={activeBet} onNewHand={newHand} />
      ) : null}

      {/* ── Ad break ── */}
      <AdBreakModal visible={adVisible} onDone={onAdDone} />
    </View>
  );
}

// ─── Hand display ─────────────────────────────────────────────────────────────
function HandDisplay({ cards }: { cards: Card[] }) {
  return (
    <View style={styles.handRow}>
      {cards.map((card, i) => (
        <MotiView
          key={card.id}
          from={{ opacity: 0, translateY: -50, scale: 0.82 }}
          animate={{ opacity: 1, translateY: 0, scale: 1 }}
          transition={{ type: "spring", delay: i * 120, damping: 20, stiffness: 300 }}
          style={[styles.cardSlot, i > 0 && { marginLeft: -14 }]}
        >
          {card.hidden ? <CardBack /> : <PlayingCard card={card} />}
        </MotiView>
      ))}
    </View>
  );
}

function PlayingCard({ card }: { card: Card }) {
  const red = isRed(card.suit);
  const suitColor = red ? "#DC2626" : "#1A1A1F";
  return (
    <View style={styles.card}>
      {/* Top-left corner */}
      <View style={styles.cardCornerTL}>
        <Text style={[styles.cardRank, { color: suitColor }]}>{card.rank}</Text>
        <Text style={[styles.cardSuitTiny, { color: suitColor }]}>{card.suit}</Text>
      </View>
      {/* Center suit */}
      <Text style={[styles.cardSuitCenter, { color: suitColor }]}>{card.suit}</Text>
      {/* Bottom-right corner (rotated) */}
      <View style={[styles.cardCornerBR, { transform: [{ rotate: "180deg" }] }]}>
        <Text style={[styles.cardRank, { color: suitColor }]}>{card.rank}</Text>
        <Text style={[styles.cardSuitTiny, { color: suitColor }]}>{card.suit}</Text>
      </View>
    </View>
  );
}

function CardBack() {
  return (
    <View style={[styles.card, styles.cardBack]}>
      <View style={styles.cardBackPattern}>
        {Array.from({ length: 12 }).map((_, i) => (
          <Text key={i} style={styles.cardBackPip}>♦</Text>
        ))}
      </View>
    </View>
  );
}

// ─── Result overlay ───────────────────────────────────────────────────────────
const OUTCOME_META: Record<NonNullable<Outcome>, { label: string; sub: string; color: string; emoji: string }> = {
  blackjack: { label: "BLACKJACK!", sub: "pays 3:2", color: BJ_GOLD, emoji: "🃏" },
  win:       { label: "YOU WIN",   sub: "beat the dealer", color: WIN_GREEN, emoji: "🏆" },
  push:      { label: "PUSH",      sub: "bet returned", color: PUSH_BLUE, emoji: "🤝" },
  lose:      { label: "DEALER WINS", sub: "better luck next time", color: LOSE_RED, emoji: "😤" },
  bust:      { label: "BUST!",     sub: "over 21", color: LOSE_RED, emoji: "💥" },
};

function ResultOverlay({ outcome, bet, onNewHand }: { outcome: NonNullable<Outcome>; bet: number; onNewHand: () => void }) {
  const meta = OUTCOME_META[outcome];
  const payout =
    outcome === "blackjack" ? Math.round(bet * 2.5) :
    outcome === "win" ? bet * 2 :
    outcome === "push" ? bet : 0;

  return (
    <Modal transparent animationType="none" statusBarTranslucent>
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: "timing", duration: 260 }}
        style={styles.resultScrim}
      >
        <MotiView
          from={{ opacity: 0, scale: 0.72, translateY: 30 }}
          animate={{ opacity: 1, scale: 1, translateY: 0 }}
          transition={{ type: "spring", delay: 80, damping: 18, stiffness: 280 }}
          style={styles.resultCard}
        >
          {/* Color accent bar */}
          <View style={[styles.resultBar, { backgroundColor: meta.color }]} />

          <Text style={styles.resultEmoji}>{meta.emoji}</Text>
          <Text style={[styles.resultLabel, { color: meta.color }]}>{meta.label}</Text>
          <Text style={styles.resultSub}>{meta.sub}</Text>

          {payout > 0 ? (
            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "spring", delay: 220, damping: 18 }}
              style={[styles.resultPayoutChip, { borderColor: meta.color + "55" }]}
            >
              <Text style={[styles.resultPayout, { color: meta.color }]}>
                {outcome === "push" ? "" : "+"}
                {payout.toLocaleString()} 💰
              </Text>
            </MotiView>
          ) : null}

          <View style={{ marginTop: 22, width: "100%" }}>
            <LiquidGlassButton
              label="New Hand"
              systemImage="arrow.clockwise"
              size="regular"
              tone="cobalt"
              variant="glassProminent"
              fullWidth
              onPress={onNewHand}
            />
          </View>
        </MotiView>
      </MotiView>
    </Modal>
  );
}

// ─── Ad break ─────────────────────────────────────────────────────────────────
function AdBreakModal({ visible, onDone }: { visible: boolean; onDone: () => void }) {
  const [secs, setSecs] = useState(AD_SECS);
  useEffect(() => {
    if (!visible) return;
    setSecs(AD_SECS);
    const iv = setInterval(() => setSecs(s => Math.max(s - 1, 0)), 1000);
    const t = setTimeout(onDone, AD_SECS * 1000);
    return () => { clearInterval(iv); clearTimeout(t); };
  }, [visible, onDone]);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.adScrim}>
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", damping: 20 }}
          style={styles.adCard}
        >
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "#12151C", borderRadius: 28 }]} />
          <View style={styles.adBadge}>
            <Ionicons name="play-circle" size={13} color="#000" />
            <Text style={styles.adBadgeText}>Short break</Text>
          </View>
          <MaterialCommunityIcons name="movie-open-play-outline" size={48} color="#FDFBF6" />
          <Text style={styles.adTitle}>Ad playing…</Text>
          <Text style={styles.adSub}>Your coins keep earning while this plays.</Text>
          <Text style={styles.adCountdown}>{secs}s</Text>
        </MotiView>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Loading
  loadingRoot: { flex: 1, backgroundColor: DARK_BG, alignItems: "center", justifyContent: "center" },
  loadingInner: { alignItems: "center" },
  loadingLabel: { ...typography.bold, marginTop: 10, fontSize: 18, letterSpacing: 6, color: GOLD },

  // Landing
  landingRoot: { flex: 1, backgroundColor: DARK_BG },
  landingScroll: { flexGrow: 1, paddingHorizontal: GUTTER, paddingBottom: 8 },

  // Band 1: Header
  headerBand: { paddingTop: 4 },
  utilRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  utilBtn: {
    width: 38, height: 38, borderRadius: 14,
    borderWidth: 1, borderColor: "rgba(246,217,138,0.22)",
    backgroundColor: "rgba(246,217,138,0.07)",
    alignItems: "center", justifyContent: "center",
  },
  resourceRow: { flexDirection: "row", gap: 12 },
  resourcePill: {
    flex: 1, flexDirection: "row", alignItems: "center",
    paddingVertical: 11, paddingHorizontal: 12,
    borderRadius: 20, borderWidth: 1, gap: 8,
  },
  resourcePillGold: { backgroundColor: "rgba(246,217,138,0.08)", borderColor: "rgba(246,217,138,0.26)" },
  resourcePillGem: { backgroundColor: "rgba(186,230,253,0.06)", borderColor: "rgba(186,230,253,0.2)" },
  resourceIcon: { fontSize: 18 },
  resourceValue: { ...typography.bold, fontSize: 16, letterSpacing: -0.4 },
  resourceSub: { ...typography.semibold, fontSize: 9, letterSpacing: 0.4, color: "rgba(255,255,255,0.38)", textTransform: "uppercase" },
  resourceAdd: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 1, borderColor: "rgba(246,217,138,0.3)",
    alignItems: "center", justifyContent: "center",
  },

  // Band 2: Hero — larger since quests are gone
  heroBand: {
    alignItems: "center", justifyContent: "center",
    minHeight: 260, paddingVertical: 24, flex: 3.2,
  },
  heroTitle: {
    ...typography.bold, fontSize: 48, letterSpacing: 5,
    color: "#FDFBF6", marginTop: 18, textAlign: "center",
  },
  heroSub: {
    ...typography.semibold, fontSize: 16, color: "rgba(253,251,246,0.5)",
    marginTop: 8, letterSpacing: 0.3, textAlign: "center",
  },

  // Logo cards
  logoCard: {
    borderRadius: 8, alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.55, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
    elevation: 8, gap: 2,
  },
  logoCardMain: { shadowOpacity: 0.7, shadowRadius: 14, elevation: 12 },

  // Band 3: Action
  actionBand: { justifyContent: "center", paddingVertical: 8, flex: 1.4 },

  // Band 4: Footer — bare round buttons, no container, no labels
  footerBand: {
    flexDirection: "row", justifyContent: "center",
    gap: 20, paddingVertical: 16,
  },
  roundIconBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.09)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.14)",
    alignItems: "center", justifyContent: "center",
  },

  // Gameplay root
  gameRoot: { flex: 1, backgroundColor: FELT_BG },

  // Top bar
  gameTopBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: GUTTER, height: 52,
  },
  quitBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingVertical: 8, paddingRight: 12 },
  quitLabel: { ...typography.semibold, fontSize: 14, color: "rgba(255,255,255,0.6)" },
  gameCoinsChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingVertical: 7, paddingHorizontal: 13, borderRadius: 999,
    backgroundColor: "rgba(246,217,138,0.12)", borderWidth: 1, borderColor: "rgba(246,217,138,0.28)",
  },
  gameCoinsIcon: { fontSize: 14 },
  gameCoinVal: { ...typography.bold, fontSize: 14, color: GOLD, letterSpacing: -0.3 },

  // Dealer zone
  dealerZone: {
    flex: 3, backgroundColor: FELT_SURFACE,
    alignItems: "center", justifyContent: "flex-end",
    paddingBottom: 14, paddingHorizontal: GUTTER,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(255,255,255,0.08)",
  },

  // Player zone
  playerZone: {
    flex: 3, alignItems: "center", justifyContent: "flex-start",
    paddingTop: 14, paddingHorizontal: GUTTER,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(255,255,255,0.08)",
  },

  // Zone header
  zoneHeader: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, marginVertical: 8 },
  zoneLabel: { ...typography.bold, fontSize: 10, letterSpacing: 2.5, color: "rgba(255,255,255,0.38)", textTransform: "uppercase" },
  scoreTag: {
    minWidth: 34, height: 26, borderRadius: 13, paddingHorizontal: 10,
    backgroundColor: "rgba(255,255,255,0.14)", alignItems: "center", justifyContent: "center",
  },
  scoreTagText: { ...typography.bold, fontSize: 14, color: "#FDFBF6" },

  // Felt middle (bet controls)
  feltMiddle: {
    flex: 1.1, alignItems: "center", justifyContent: "center",
    paddingHorizontal: GUTTER,
  },
  betArea: { alignItems: "center", width: "100%" },
  chip: {
    width: 52, height: 52, borderRadius: 26,
    borderWidth: 3, alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.4, shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  chipLabel: { ...typography.bold, fontSize: 14, letterSpacing: -0.2 },
  activeBetChip: {
    minWidth: 180,
    paddingVertical: 10, paddingHorizontal: 22, borderRadius: 999,
    backgroundColor: "rgba(246,217,138,0.12)", borderWidth: 1, borderColor: "rgba(246,217,138,0.3)",
    alignItems: "center",
  },
  activeBetLabel: { ...typography.bold, fontSize: 10, letterSpacing: 1.6, color: "rgba(246,217,138,0.58)", textTransform: "uppercase" },
  activeBetVal: { ...typography.bold, fontSize: 22, color: GOLD, letterSpacing: -0.5 },

  // Action bar
  actionBar: {
    height: 88, paddingHorizontal: GUTTER, paddingTop: 8,
    justifyContent: "center",
  },
  idleActionWrap: {
    flex: 1,
    justifyContent: "flex-start",
    gap: 0,
  },
  dealActionOutline: {
    borderRadius: 18,
    backgroundColor: "#BFEAFF",
    borderWidth: 1,
    borderColor: "#67BCEB",
    padding: 1.5,
    overflow: "hidden",
  },
  dealActionOutlineDisabled: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderColor: "rgba(255,255,255,0.25)",
  },
  dealActionButton: {
    borderRadius: 14,
  },
  dealActionButtonActive: {
    backgroundColor: "#8EDBFF",
  },
  dealActionButtonDisabled: {
    backgroundColor: "rgba(255,255,255,0.45)",
  },
  dealActionContent: {
    minHeight: 48,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  dealActionText: {
    ...typography.bold,
    marginRight: 6,
    fontSize: 14,
    color: "#000000",
    letterSpacing: -0.25,
  },
  inlineStakeHint: {
    ...typography.semibold,
    fontSize: 12,
    color: "rgba(253,251,246,0.54)",
    letterSpacing: 0.1,
  },
  gameActions: { flexDirection: "row", gap: 10 },
  actionBtn: { flex: 1 },
  dealerPlayingText: { ...typography.semibold, fontSize: 13, color: "rgba(255,255,255,0.4)", letterSpacing: 0.3 },
  chipTray: {
    paddingHorizontal: GUTTER,
    paddingTop: 8,
    paddingBottom: 14,
    gap: 10,
  },
  chipTrayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  trayBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  chipStackPreview: {
    flex: 1,
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  stackChip: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  clearBetBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.26)",
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  clearBetText: {
    ...typography.bold,
    fontSize: 12,
    color: "rgba(253,251,246,0.85)",
    letterSpacing: 0.2,
  },
  stakeChipAnimWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  stakeChip: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  stakeChipLabel: { ...typography.bold, fontSize: 14, letterSpacing: -0.2 },

  // Hand
  handRow: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  cardSlot: {},

  // Playing card
  card: {
    width: 70, height: 100, borderRadius: 8,
    backgroundColor: CARD_BG,
    borderWidth: 1, borderColor: "rgba(0,0,0,0.2)",
    shadowColor: "#000", shadowOpacity: 0.45, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
    elevation: 7,
  },
  cardCornerTL: { position: "absolute", top: 5, left: 7, alignItems: "center" },
  cardCornerBR: { position: "absolute", bottom: 5, right: 7, alignItems: "center" },
  cardRank: { ...typography.bold, fontSize: 13, lineHeight: 15 },
  cardSuitTiny: { fontSize: 10, lineHeight: 12 },
  cardSuitCenter: { fontSize: 28, position: "absolute", top: "50%", left: 0, right: 0, textAlign: "center", marginTop: -16 },

  // Card back
  cardBack: { backgroundColor: "#1B3D6F", overflow: "hidden" },
  cardBackPattern: { flex: 1, flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "center", padding: 4, gap: 2 },
  cardBackPip: { fontSize: 10, color: "rgba(100,160,255,0.4)" },

  // Result
  resultScrim: { flex: 1, backgroundColor: "rgba(0,0,0,0.72)", alignItems: "center", justifyContent: "center", padding: GUTTER },
  resultCard: {
    width: "100%", maxWidth: 320,
    backgroundColor: "#111827", borderRadius: 28,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
    overflow: "hidden", padding: 28, alignItems: "center",
  },
  resultBar: { position: "absolute", top: 0, left: 0, right: 0, height: 4 },
  resultEmoji: { fontSize: 48, marginBottom: 8, marginTop: 6 },
  resultLabel: { ...typography.bold, fontSize: 32, letterSpacing: -0.5, textAlign: "center" },
  resultSub: { ...typography.semibold, fontSize: 14, color: "rgba(255,255,255,0.45)", marginTop: 4, textAlign: "center" },
  resultPayoutChip: {
    marginTop: 16, paddingVertical: 8, paddingHorizontal: 20,
    borderRadius: 999, borderWidth: 1, backgroundColor: "rgba(255,255,255,0.06)",
  },
  resultPayout: { ...typography.bold, fontSize: 22, letterSpacing: -0.4 },

  // Ad
  adScrim: { flex: 1, backgroundColor: "rgba(0,0,0,0.78)", alignItems: "center", justifyContent: "center", padding: GUTTER },
  adCard: {
    width: "100%", maxWidth: 320, minHeight: 280,
    borderRadius: 28, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
    overflow: "hidden", padding: 20, alignItems: "center", justifyContent: "space-between",
  },
  adBadge: {
    alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 5,
    paddingVertical: 5, paddingHorizontal: 10, borderRadius: 999,
    backgroundColor: GOLD, borderWidth: 1, borderColor: "rgba(0,0,0,0.12)",
  },
  adBadgeText: { ...typography.bold, fontSize: 10, color: "#000", letterSpacing: 0.2 },
  adTitle: { ...typography.bold, fontSize: 26, color: "#FDFBF6", letterSpacing: -0.8, marginTop: 12 },
  adSub: { ...typography.semibold, fontSize: 13, color: "rgba(253,251,246,0.55)", textAlign: "center", marginTop: 4 },
  adCountdown: { ...typography.bold, fontSize: 20, color: GOLD },
});
