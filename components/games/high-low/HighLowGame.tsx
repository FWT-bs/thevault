import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { V2 } from "../../../constants/glassPalette";
import { typography } from "../../../constants/typography";
import { useGameProgress } from "../../../services/gameProgress";
import {
  createGameRoute,
  type GameModeOption,
  type GameplayScreenProps,
} from "../createGameRoute";
import { InAppGameShell, type SecondaryAction } from "../_template/InAppGameShell";

const GAME_ID = "high-low";

const TUTORIAL_BULLETS = [
  "Tap HIGHER or LOWER to predict the next vault card.",
  "Streaks multiply your score — each correct pick scores 10 × your streak.",
  "Cash out any time to bank your score. Restart resets the run.",
];

type HighLowModeId = "steady" | "streak" | "sprint";

const MODE_OPTIONS: ReadonlyArray<GameModeOption<HighLowModeId>> = [
  { id: "steady", label: "Steady", description: "3 lives, ties always count as safe." },
  { id: "streak", label: "Streak", description: "1 life, no timer. Push your run." },
  { id: "sprint", label: "Sprint", description: "1 life, 6 seconds per pick." },
];

const MODE_SETTINGS: Record<
  HighLowModeId,
  { lives: number; tiesSafe: boolean; timerSeconds: number | null }
> = {
  steady: { lives: 3, tiesSafe: true, timerSeconds: null },
  streak: { lives: 1, tiesSafe: false, timerSeconds: null },
  sprint: { lives: 1, tiesSafe: false, timerSeconds: 6 },
};

const SUITS = [
  { id: "diamond", glyph: "♦", color: "#E11D48" },
  { id: "heart", glyph: "♥", color: "#E11D48" },
  { id: "club", glyph: "♣", color: "#0F172A" },
  { id: "spade", glyph: "♠", color: "#0F172A" },
] as const;

type Suit = (typeof SUITS)[number];

type Card = {
  id: string;
  rank: number;
  suit: Suit;
};

const RANK_LABEL: Record<number, string> = {
  2: "2",
  3: "3",
  4: "4",
  5: "5",
  6: "6",
  7: "7",
  8: "8",
  9: "9",
  10: "10",
  11: "J",
  12: "Q",
  13: "K",
  14: "A",
};

function buildDeck(): Card[] {
  const cards: Card[] = [];
  for (const suit of SUITS) {
    for (let rank = 2; rank <= 14; rank++) {
      cards.push({ id: `${suit.id}-${rank}`, rank, suit });
    }
  }
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

type Verdict = "higher" | "lower" | null;

function HighLowGameplay({
  title,
  modeId,
  modeLabel,
  accent,
  accentSoft,
  accentInk,
  onQuit,
  onFinish,
}: GameplayScreenProps<HighLowModeId>) {
  const settings = MODE_SETTINGS[modeId];
  const { progress, merge, markTutorialSeen } = useGameProgress(GAME_ID);

  const [deck, setDeck] = useState<Card[]>(() => buildDeck());
  const [current, setCurrent] = useState<Card>(() => deck[0] ?? buildDeck()[0]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [lives, setLives] = useState(settings.lives);
  const [paused, setPaused] = useState(false);
  const [lastVerdict, setLastVerdict] = useState<Verdict>(null);
  const [timer, setTimer] = useState<number>(settings.timerSeconds ?? 0);
  const [history, setHistory] = useState<Card[]>([]);

  const gameOver = lives <= 0;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Persist best score whenever it climbs.
  useEffect(() => {
    if (progress && score > progress.bestScore) merge({ bestScore: score });
  }, [score, progress, merge]);

  // Fresh run whenever the player switches modes.
  useEffect(() => {
    const fresh = buildDeck();
    const first = fresh.pop()!;
    setDeck(fresh);
    setCurrent(first);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setLives(settings.lives);
    setLastVerdict(null);
    setHistory([]);
    setTimer(settings.timerSeconds ?? 0);
  }, [modeId, settings.lives, settings.timerSeconds]);

  const clearTicker = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Sprint mode countdown — running out times-out as a wrong guess.
  useEffect(() => {
    clearTicker();
    if (settings.timerSeconds === null) return;
    if (paused || gameOver) return;
    timerRef.current = setInterval(() => {
      setTimer((value) => {
        if (value <= 1) {
          // Timeout → cost a life, reset timer to fresh window.
          setLives((life) => Math.max(0, life - 1));
          setStreak(0);
          setLastVerdict(null);
          return settings.timerSeconds ?? 0;
        }
        return value - 1;
      });
    }, 1000);
    return clearTicker;
  }, [paused, gameOver, settings.timerSeconds, clearTicker]);

  const drawNext = useCallback((): { next: Card; nextDeck: Card[] } => {
    if (deck.length === 0) {
      const reshuffled = buildDeck().filter((c) => c.id !== current.id);
      return { next: reshuffled.pop()!, nextDeck: reshuffled };
    }
    const copy = deck.slice();
    const next = copy.pop()!;
    return { next, nextDeck: copy };
  }, [deck, current.id]);

  const guess = useCallback(
    (direction: "higher" | "lower") => {
      if (gameOver || paused) return;

      const { next, nextDeck } = drawNext();
      const correct =
        (direction === "higher" && next.rank > current.rank) ||
        (direction === "lower" && next.rank < current.rank) ||
        (settings.tiesSafe && next.rank === current.rank);

      setHistory((items) => [current, ...items].slice(0, 6));
      setCurrent(next);
      setDeck(nextDeck);
      setLastVerdict(direction);

      if (correct) {
        const nextStreak = streak + 1;
        const gain = 10 * nextStreak;
        setStreak(nextStreak);
        setBestStreak((b) => Math.max(b, nextStreak));
        setScore((s) => s + gain);
        if (settings.timerSeconds !== null) setTimer(settings.timerSeconds);
      } else {
        setStreak(0);
        setLives((l) => Math.max(0, l - 1));
      }
    },
    [gameOver, paused, drawNext, current, streak, settings.tiesSafe, settings.timerSeconds],
  );

  const restartRun = useCallback(() => {
    const fresh = buildDeck();
    const first = fresh.pop()!;
    setDeck(fresh);
    setCurrent(first);
    setScore(0);
    setStreak(0);
    setLives(settings.lives);
    setLastVerdict(null);
    setHistory([]);
    setTimer(settings.timerSeconds ?? 0);
  }, [settings.lives, settings.timerSeconds]);

  const cashOut = useCallback(() => {
    onFinish(score);
  }, [onFinish, score]);

  const hudPills = useMemo(() => {
    const base = [
      { label: "Score", value: String(score) },
      { label: "Streak", value: String(streak) },
      { label: "Lives", value: `${lives}/${settings.lives}` },
    ];
    if (settings.timerSeconds !== null) {
      return [
        { label: "Score", value: String(score) },
        { label: "Streak", value: String(streak) },
        { label: "Time", value: `${timer}s` },
      ];
    }
    return base;
  }, [score, streak, lives, settings.lives, settings.timerSeconds, timer]);

  const secondaryActions: SecondaryAction[] = useMemo(
    () => [
      { label: "Cash out", icon: "ribbon-outline", onPress: cashOut, disabled: score === 0 },
      { label: "Restart", icon: "refresh", onPress: restartRun },
    ],
    [cashOut, restartRun, score],
  );

  const verdictLabel =
    lastVerdict === "higher" ? "You picked HIGHER" :
    lastVerdict === "lower" ? "You picked LOWER" :
    "Pick higher or lower";

  return (
    <InAppGameShell
      title={title}
      subtitle={`${modeLabel} · Best streak ${bestStreak}`}
      accent={accent}
      accentSoft={accentSoft}
      accentInk={accentInk}
      hudPills={hudPills}
      levelComplete={
        gameOver
          ? {
              title: "Run ended",
              subtitle: `Best streak ${bestStreak} · Final score ${score}. Cash out or restart.`,
            }
          : null
      }
      onQuit={onQuit}
      onPause={() => setPaused(true)}
      paused={paused}
      onResume={() => setPaused(false)}
      onRestartLevel={() => {
        setPaused(false);
        restartRun();
      }}
      onClaimExit={cashOut}
      onNextLevel={restartRun}
      nextLevelLabel="New run"
      claimLabel="Bank score"
      secondaryActions={secondaryActions}
      tutorial={{
        visible: progress != null && !progress.tutorialSeen,
        title: "How to play High Low",
        bullets: TUTORIAL_BULLETS,
        onDismiss: markTutorialSeen,
      }}
    >
      <View style={styles.body}>
        <View style={styles.verdictRow}>
          <Text style={styles.verdictText}>{verdictLabel}</Text>
        </View>

        <View style={styles.cardWrap}>
          <CardFace card={current} accentInk={accentInk} />
          <Text style={styles.cardCaption}>Current vault card</Text>
        </View>

        <View style={styles.choiceRow}>
          <ChoiceButton
            label="HIGHER"
            sub="Next rank is greater"
            icon="arrow-up"
            disabled={gameOver}
            onPress={() => guess("higher")}
            accent={accent}
            accentInk={accentInk}
          />
          <ChoiceButton
            label="LOWER"
            sub="Next rank is smaller"
            icon="arrow-down"
            disabled={gameOver}
            onPress={() => guess("lower")}
            accent={accent}
            accentInk={accentInk}
          />
        </View>

        <View style={styles.historyRow}>
          <Text style={styles.historyLabel}>Recent</Text>
          <View style={styles.historyList}>
            {history.length === 0 ? (
              <Text style={styles.historyEmpty}>No flips yet</Text>
            ) : (
              history.map((card) => (
                <View key={`${card.id}-${card.rank}`} style={styles.miniCard}>
                  <Text style={[styles.miniRank, { color: card.suit.color }]}>
                    {RANK_LABEL[card.rank]}
                  </Text>
                  <Text style={[styles.miniSuit, { color: card.suit.color }]}>
                    {card.suit.glyph}
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>
      </View>
    </InAppGameShell>
  );
}

function CardFace({ card, accentInk }: { card: Card; accentInk: string }) {
  return (
    <MotiView
      key={card.id}
      from={{ opacity: 0, scale: 0.9, rotateY: "-25deg" }}
      animate={{ opacity: 1, scale: 1, rotateY: "0deg" }}
      transition={{ type: "timing", duration: 240 }}
      style={[styles.card, { borderColor: `${accentInk}33` }]}
    >
      <Text style={[styles.cardCorner, styles.cardCornerTop, { color: card.suit.color }]}>
        {RANK_LABEL[card.rank]}
        {"\n"}
        {card.suit.glyph}
      </Text>
      <Text style={[styles.cardRank, { color: card.suit.color }]}>{RANK_LABEL[card.rank]}</Text>
      <Text style={[styles.cardSuit, { color: card.suit.color }]}>{card.suit.glyph}</Text>
      <Text style={[styles.cardCorner, styles.cardCornerBottom, { color: card.suit.color }]}>
        {card.suit.glyph}
        {"\n"}
        {RANK_LABEL[card.rank]}
      </Text>
    </MotiView>
  );
}

function ChoiceButton({
  label,
  sub,
  icon,
  onPress,
  disabled,
  accent,
  accentInk,
}: {
  label: string;
  sub: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  onPress: () => void;
  disabled: boolean;
  accent: string;
  accentInk: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.choiceButton,
        { borderColor: accentInk, backgroundColor: "#FFFFFF" },
        pressed && !disabled && { backgroundColor: `${accent}1A`, transform: [{ scale: 0.98 }] },
        disabled && styles.disabled,
      ]}
    >
      <View style={[styles.choiceIcon, { backgroundColor: `${accent}22`, borderColor: accentInk }]}>
        <Ionicons name={icon} size={22} color={accentInk} />
      </View>
      <Text style={[styles.choiceLabel, { color: accentInk }]}>{label}</Text>
      <Text style={styles.choiceSub}>{sub}</Text>
    </Pressable>
  );
}

const HighLowGame = createGameRoute<HighLowModeId>({
  gameId: "high-low",
  modeOptions: MODE_OPTIONS,
  GameplayScreen: HighLowGameplay,
});

export default HighLowGame;

const styles = StyleSheet.create({
  body: {
    flex: 1,
    gap: 12,
  },
  verdictRow: {
    alignItems: "center",
    paddingVertical: 4,
  },
  verdictText: {
    ...typography.bold,
    fontSize: 13,
    letterSpacing: 0.4,
    color: V2.muted,
    textTransform: "uppercase",
  },
  cardWrap: {
    alignItems: "center",
    gap: 6,
  },
  card: {
    width: 168,
    height: 232,
    borderRadius: 22,
    borderWidth: 2,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  cardRank: {
    ...typography.bold,
    fontSize: 64,
    letterSpacing: 0,
    lineHeight: 64,
  },
  cardSuit: {
    fontSize: 38,
    marginTop: 4,
  },
  cardCorner: {
    ...typography.bold,
    position: "absolute",
    fontSize: 18,
    lineHeight: 20,
    textAlign: "center",
  },
  cardCornerTop: {
    top: 8,
    left: 12,
  },
  cardCornerBottom: {
    bottom: 8,
    right: 12,
    transform: [{ rotate: "180deg" }],
  },
  cardCaption: {
    ...typography.semibold,
    fontSize: 11,
    color: V2.muted,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  choiceRow: {
    flexDirection: "row",
    gap: 12,
  },
  choiceButton: {
    flex: 1,
    minHeight: 96,
    borderRadius: 22,
    borderWidth: 2,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  choiceIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  choiceLabel: {
    ...typography.bold,
    fontSize: 18,
    letterSpacing: 0.4,
  },
  choiceSub: {
    ...typography.semibold,
    fontSize: 11,
    color: V2.muted,
    letterSpacing: 0,
  },
  disabled: {
    opacity: 0.45,
  },
  historyRow: {
    marginTop: 4,
    gap: 6,
  },
  historyLabel: {
    ...typography.bold,
    fontSize: 10,
    letterSpacing: 0.6,
    color: V2.muted,
    textTransform: "uppercase",
  },
  historyList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    minHeight: 48,
    alignItems: "center",
  },
  historyEmpty: {
    ...typography.semibold,
    fontSize: 12,
    color: V2.muted,
  },
  miniCard: {
    minWidth: 38,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: V2.hairlineStrong,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  miniRank: {
    ...typography.bold,
    fontSize: 14,
    lineHeight: 16,
  },
  miniSuit: {
    fontSize: 14,
    lineHeight: 16,
  },
});
