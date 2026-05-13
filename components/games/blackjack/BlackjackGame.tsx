import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MotiView } from "moti";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import PokerChip, { chipPresets, type PokerChipPalette } from "../../game/PokerChip";
import { GameLaunchPage } from "../../v2/GameLaunchPage";
import { GameLoader } from "../../v2/GameLoader";
import { GAME_CONFIGS } from "../../../constants/gameTemplates";
import { V2 } from "../../../constants/glassPalette";
import { typography } from "../../../constants/typography";

const AD_MS = 90_000;
const AD_SECS = 5;
const START_CREDITS = 1_200;
const DEFAULT_BET = 25;
const GUTTER = 24;
const SOFT_BORDER = "rgba(0,0,0,0.10)";
const HAIRLINE = "rgba(0,0,0,0.06)";

const TABLE = {
  rail: "#12151D",
  felt: "#06331F",
  feltDeep: "#0C5C38",
  feltInk: "#DDF8E9",
  cream: "#FFF8EC",
  red: "#E93557",
  gold: "#FFC24A",
  blue: "#33B8FF",
  lavender: "#9B7CFF",
} as const;

type Suit = "heart" | "diamond" | "club" | "spade";
type Rank = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K";
type Phase = "launch" | "loading" | "playing";
type BlackjackPlayMode = "normal" | "wager";
type GameState = "idle" | "player" | "dealer" | "done";
type Outcome = "blackjack" | "win" | "push" | "lose" | "bust" | null;

type Card = {
  suit: Suit;
  rank: Rank;
  hidden?: boolean;
  id: string;
};

type Chip = PokerChipPalette & {
  value: number;
  label: string;
};

const SUITS: Suit[] = ["heart", "diamond", "club", "spade"];
const RANKS: Rank[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const CHIP_VALUES: Chip[] = [
  { value: 10, label: "CR", ...chipPresets.blue },
  { value: 25, label: "CR", ...chipPresets.green },
  { value: 50, label: "CR", ...chipPresets.red },
  { value: 100, label: "CR", ...chipPresets.black },
];

const PLAY_MODE_OPTIONS = [
  {
    id: "normal",
    label: "Normal",
    description: "No wagering. Earn from ads.",
  },
  {
    id: "wager",
    label: "Wager",
    description: "Use chips with balance.",
  },
] satisfies Array<{ id: BlackjackPlayMode; label: string; description: string }>;

const OUTCOME_META: Record<
  NonNullable<Outcome>,
  {
    label: string;
    sub: string;
    color: string;
    icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  }
> = {
  blackjack: {
    label: "Blackjack",
    sub: "Natural 21 pays 3:2",
    color: TABLE.gold,
    icon: "cards-playing-spade-multiple",
  },
  win: {
    label: "You win",
    sub: "Your hand beat the dealer",
    color: "#30D158",
    icon: "trophy-variant-outline",
  },
  push: {
    label: "Push",
    sub: "Same total, bet returned",
    color: TABLE.blue,
    icon: "scale-balance",
  },
  lose: {
    label: "Dealer wins",
    sub: "The house takes this hand",
    color: V2.red,
    icon: "close-circle-outline",
  },
  bust: {
    label: "Bust",
    sub: "Your hand went over 21",
    color: V2.red,
    icon: "alert-octagon-outline",
  },
};

const NORMAL_OUTCOME_COPY: Record<NonNullable<Outcome>, string> = {
  blackjack: "Blackjack!",
  win: "You Win!",
  push: "Tie",
  lose: "You Lost",
  bust: "Oveer 21! You Lost",
};

function freshDeck(): Card[] {
  const deck: Card[] = [];
  let n = 0;

  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank, id: `${suit}-${rank}-${n}` });
      n += 1;
    }
  }

  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

function drawCards(deck: Card[], count: number): { cards: Card[]; deck: Card[] } {
  const source = deck.length >= count ? deck : freshDeck();
  return {
    cards: source.slice(0, count),
    deck: source.slice(count),
  };
}

function cardValue(rank: Rank): number {
  if (rank === "A") return 11;
  if (rank === "J" || rank === "Q" || rank === "K") return 10;
  return Number.parseInt(rank, 10);
}

function handScore(hand: Card[]): number {
  let total = 0;
  let aces = 0;

  for (const card of hand) {
    if (card.hidden) continue;
    total += cardValue(card.rank);
    if (card.rank === "A") aces += 1;
  }

  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }

  return total;
}

function visibleScore(hand: Card[]): number {
  return handScore(hand.filter((card) => !card.hidden));
}

function isBust(hand: Card[]): boolean {
  return handScore(hand) > 21;
}

function isBlackjack(hand: Card[]): boolean {
  return hand.length === 2 && handScore(hand) === 21;
}

function isSplittablePair(hand: Card[]): boolean {
  return hand.length === 2 && hand[0].rank === hand[1].rank && !isBlackjack(hand);
}

function outcomeVsDealer(playerHand: Card[], dealerFinal: number): "win" | "lose" | "push" {
  const p = handScore(playerHand);
  if (dealerFinal > 21 || p > dealerFinal) return "win";
  if (p === dealerFinal) return "push";
  return "lose";
}

function isRedSuit(suit: Suit): boolean {
  return suit === "heart" || suit === "diamond";
}

function suitGlyph(suit: Suit): string {
  if (suit === "heart") return "♥";
  if (suit === "diamond") return "♦";
  if (suit === "club") return "♣";
  return "♠";
}

function runDealer(
  hand: Card[],
  deck: Card[],
  onCard: (hand: Card[], deck: Card[]) => void,
  onDone: (score: number) => void,
) {
  function step(currentHand: Card[], currentDeck: Card[]) {
    const score = handScore(currentHand);
    if (score >= 17) {
      setTimeout(() => onDone(score), 420);
      return;
    }

    setTimeout(() => {
      const draw = drawCards(currentDeck, 1);
      const nextHand = [...currentHand, draw.cards[0]];
      onCard(nextHand, draw.deck);
      step(nextHand, draw.deck);
    }, 620);
  }

  setTimeout(() => step(hand, deck), 380);
}

export default function BlackjackGame() {
  const router = useRouter();
  const params = useLocalSearchParams<{ start?: string; mode?: string }>();
  const startInGameplay = params.start === "playing";
  const startAtLoader = params.start === "loading";
  const initialPlayMode: BlackjackPlayMode = params.mode === "wager" ? "wager" : "normal";
  const [phase, setPhase] = useState<Phase>(
    startInGameplay ? "playing" : startAtLoader ? "loading" : "launch",
  );
  const [playMode, setPlayMode] = useState<BlackjackPlayMode>(initialPlayMode);
  const [credits, setCredits] = useState(START_CREDITS);
  const [adVisible, setAdVisible] = useState(false);
  const adRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cfg = GAME_CONFIGS.blackjack;

  useEffect(() => {
    if (phase !== "playing") {
      if (adRef.current) clearInterval(adRef.current);
      return;
    }

    adRef.current = setInterval(() => setAdVisible(true), AD_MS);
    return () => {
      if (adRef.current) clearInterval(adRef.current);
    };
  }, [phase]);

  if (phase === "launch") {
    return (
      <GameLaunchPage
        gameConfig={cfg}
        modeOptions={PLAY_MODE_OPTIONS}
        selectedModeId={playMode}
        showHeaderBalance={playMode === "wager"}
        onModeChange={(mode) => setPlayMode(mode === "wager" ? "wager" : "normal")}
        onBack={() => {
          if (router.canGoBack()) router.back();
          else router.replace("/games-in-app");
        }}
        onPlay={() => setPhase("loading")}
      />
    );
  }

  if (phase === "loading") {
    return <GameLoader gameConfig={cfg} onReady={() => setPhase("playing")} />;
  }

  return (
    <GameplayScreen
      playMode={playMode}
      credits={credits}
      setCredits={setCredits}
      adVisible={adVisible}
      onAdDone={() => setAdVisible(false)}
      onQuit={() => setPhase("launch")}
    />
  );
}

function GameplayScreen({
  playMode,
  credits,
  setCredits,
  adVisible,
  onAdDone,
  onQuit,
}: {
  playMode: BlackjackPlayMode;
  credits: number;
  setCredits: React.Dispatch<React.SetStateAction<number>>;
  adVisible: boolean;
  onAdDone: () => void;
  onQuit: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const compact = width < 380;
  const shortScreen = height < 760;
  const [deck, setDeck] = useState<Card[]>(() => freshDeck());
  const [playerHands, setPlayerHands] = useState<Card[][]>([]);
  const [activeHandIndex, setActiveHandIndex] = useState(0);
  const [handBets, setHandBets] = useState<number[]>([]);
  const [handsDone, setHandsDone] = useState<boolean[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [betStack, setBetStack] = useState<number[]>([DEFAULT_BET]);
  const [gameState, setGameState] = useState<GameState>("idle");
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [resultCaption, setResultCaption] = useState<string | null>(null);
  const [resultPayoutOverride, setResultPayoutOverride] = useState<string | null>(null);
  const [chipAnimKey, setChipAnimKey] = useState(0);
  const isWagerMode = playMode === "wager";

  const currentBet = useMemo(
    () => betStack.reduce((sum, value) => sum + value, 0),
    [betStack],
  );
  const activePlayerHand = playerHands[activeHandIndex] ?? [];
  const playerScore = handScore(activePlayerHand);
  const hasSplit = playerHands.length === 2;
  const dealerScore = handScore(dealerHand);
  const dealerVisibleScore = visibleScore(dealerHand);
  const activeHandBet = handBets[activeHandIndex] ?? 0;
  const canDeal =
    gameState === "idle" && (!isWagerMode || (currentBet > 0 && currentBet <= credits));
  const canDouble =
    isWagerMode &&
    gameState === "player" &&
    activePlayerHand.length === 2 &&
    credits >= activeHandBet;
  const canSplitNow =
    gameState === "player" &&
    playerHands.length === 1 &&
    isSplittablePair(playerHands[0]) &&
    (!isWagerMode || credits >= (handBets[0] ?? 0));
  const displayedBet = isWagerMode
    ? gameState === "idle"
      ? currentBet
      : activeHandBet
    : null;
  const moveTitle =
    gameState === "idle"
      ? isWagerMode
        ? "Place your bet"
        : "Start a round"
      : gameState === "player"
        ? "Choose your move"
        : gameState === "dealer"
          ? "Dealer thinking"
          : "Round complete";

  const settle = useCallback(
    (nextOutcome: NonNullable<Outcome>, bet: number, caption: string | null = null) => {
      setGameState("done");
      setOutcome(nextOutcome);
      setResultCaption(caption);
      if (isWagerMode) {
        const payout =
          nextOutcome === "blackjack"
            ? Math.round(bet * 2.5)
            : nextOutcome === "win"
              ? bet * 2
              : nextOutcome === "push"
                ? bet
                : 0;
        setResultPayoutOverride(`${payout.toLocaleString()} CR`);
        if (nextOutcome === "blackjack") {
          setCredits((value) => value + Math.round(bet * 2.5));
          return;
        }
        if (nextOutcome === "win") {
          setCredits((value) => value + bet * 2);
          return;
        }
        if (nextOutcome === "push") {
          setCredits((value) => value + bet);
          return;
        }
        return;
      }
      setResultPayoutOverride(null);
    },
    [isWagerMode, setCredits],
  );

  const settleSplitAgainstDealer = useCallback(
    (hands: Card[][], bets: number[], dealerFinal: number) => {
      const lines: string[] = [];
      let creditDelta = 0;
      let wins = 0;
      let losses = 0;

      for (let i = 0; i < hands.length; i += 1) {
        const hand = hands[i];
        const bet = bets[i] ?? 0;
        if (isBust(hand)) {
          lines.push(`Hand ${i + 1}: Bust`);
          losses += 1;
          continue;
        }
        const r = outcomeVsDealer(hand, dealerFinal);
        if (r === "win") {
          lines.push(`Hand ${i + 1}: Win`);
          wins += 1;
          creditDelta += bet * 2;
        } else if (r === "push") {
          lines.push(`Hand ${i + 1}: Push`);
          creditDelta += bet;
        } else {
          lines.push(`Hand ${i + 1}: Lose`);
          losses += 1;
        }
      }

      if (isWagerMode) {
        setCredits((value) => value + creditDelta);
        setResultPayoutOverride(`${creditDelta.toLocaleString()} CR`);
      } else {
        setResultPayoutOverride(null);
      }

      let aggregate: NonNullable<Outcome>;
      if (wins > 0 && losses === 0) aggregate = "win";
      else if (wins === 0 && losses > 0) aggregate = "lose";
      else if (wins > 0 && losses > 0) {
        if (creditDelta > 0) aggregate = "win";
        else if (creditDelta < 0) aggregate = "lose";
        else aggregate = "push";
      } else aggregate = "push";

      setGameState("done");
      setOutcome(aggregate);
      setResultCaption(lines.join(" · "));
    },
    [isWagerMode, setCredits],
  );

  const triggerDealerTurn = useCallback(
    (
      finalHands: Card[][],
      finalBets: number[],
      currentDeck: Card[],
      currentDealerHand: Card[],
    ) => {
      const revealedDealer = currentDealerHand.map((card) => ({ ...card, hidden: false }));
      setDealerHand(revealedDealer);
      setGameState("dealer");

      const playerScores = finalHands.map((h) => handScore(h));
      runDealer(
        revealedDealer,
        currentDeck,
        (nextHand, nextDeck) => {
          setDealerHand(nextHand);
          setDeck(nextDeck);
        },
        (dealerFinal) => {
          if (finalHands.length === 1) {
            const playerFinal = playerScores[0];
            const bet = finalBets[0] ?? 0;
            if (isBust(finalHands[0])) {
              settle("bust", bet);
              return;
            }
            if (dealerFinal > 21 || playerFinal > dealerFinal) {
              settle("win", bet);
              return;
            }
            if (dealerFinal === playerFinal) {
              settle("push", bet);
              return;
            }
            settle("lose", bet);
            return;
          }

          settleSplitAgainstDealer(finalHands, finalBets, dealerFinal);
        },
      );
    },
    [settle, settleSplitAgainstDealer],
  );

  const deal = useCallback(() => {
    if (gameState !== "idle") return;
    if (isWagerMode && (currentBet <= 0 || currentBet > credits)) return;

    const draw = drawCards(deck, 4);
    const [playerOne, dealerOne, playerTwo, dealerTwo] = draw.cards;
    const playerCards = [playerOne, playerTwo];
    const dealerCards = [dealerOne, { ...dealerTwo, hidden: true }];
    const bet = isWagerMode ? currentBet : 0;
    const playerNatural = isBlackjack(playerCards);
    const dealerNatural = isBlackjack([dealerOne, dealerTwo]);

    setDeck(draw.deck);
    setPlayerHands([playerCards]);
    setActiveHandIndex(0);
    setHandBets([bet]);
    setHandsDone([false]);
    setDealerHand(dealerCards);
    setOutcome(null);
    setResultCaption(null);
    setResultPayoutOverride(null);
    if (isWagerMode) {
      setCredits((value) => value - bet);
    }

    if (playerNatural || dealerNatural) {
      setGameState("dealer");
      setTimeout(() => {
        setDealerHand([dealerOne, { ...dealerTwo, hidden: false }]);
        setTimeout(() => {
          if (playerNatural && dealerNatural) {
            settle("push", bet);
            return;
          }

          if (playerNatural) {
            settle("blackjack", bet);
            return;
          }

          settle("lose", bet);
        }, 520);
      }, 620);
      return;
    }

    setGameState("player");
  }, [credits, currentBet, deck, gameState, isWagerMode, setCredits, settle]);

  const addChip = useCallback(
    (chipValue: number) => {
      if (gameState !== "idle") return;
      if (!isWagerMode) return;
      if (currentBet + chipValue > credits) return;

      setBetStack((stack) => [...stack, chipValue]);
      setChipAnimKey((value) => value + 1);
    },
    [credits, currentBet, gameState, isWagerMode],
  );

  const undoChip = useCallback(() => {
    if (gameState !== "idle") return;
    if (!isWagerMode) return;
    setBetStack((stack) => stack.slice(0, -1));
    setChipAnimKey((value) => value + 1);
  }, [gameState, isWagerMode]);

  const clearBet = useCallback(() => {
    if (gameState !== "idle") return;
    if (!isWagerMode) return;
    setBetStack([]);
    setChipAnimKey((value) => value + 1);
  }, [gameState, isWagerMode]);

  const handleUndoPress = useCallback(() => {
    undoChip();
  }, [undoChip]);

  const handleDealPress = useCallback(() => {
    deal();
  }, [deal]);

  const handleClearPress = useCallback(() => {
    clearBet();
  }, [clearBet]);

  const advanceAfterHandResolved = useCallback(
    (
      nextHands: Card[][],
      nextBets: number[],
      nextDone: boolean[],
      deckAfter: Card[],
    ) => {
      if (nextHands.length === 1) {
        triggerDealerTurn(nextHands, nextBets, deckAfter, dealerHand);
        return;
      }
      const nextIdx = nextDone.findIndex((d, i) => !d && !isBust(nextHands[i]));
      if (nextIdx >= 0) {
        setHandsDone(nextDone);
        setActiveHandIndex(nextIdx);
        return;
      }
      setHandsDone(nextDone);
      triggerDealerTurn(nextHands, nextBets, deckAfter, dealerHand);
    },
    [dealerHand, triggerDealerTurn],
  );

  const hit = useCallback(() => {
    if (gameState !== "player") return;

    const idx = activeHandIndex;
    const hands = playerHands;
    const hand = hands[idx];
    if (!hand) return;

    const draw = drawCards(deck, 1);
    const nextHand = [...hand, draw.cards[0]];
    const nextHands = hands.map((h, i) => (i === idx ? nextHand : h));
    setDeck(draw.deck);
    setPlayerHands(nextHands);

    if (isBust(nextHand)) {
      const nextDone = handsDone.map((d, i) => (i === idx ? true : d));
      setHandsDone(nextDone);
      if (nextHands.length === 1) {
        settle("bust", handBets[0] ?? 0);
        return;
      }
      if (nextHands.every(isBust)) {
        triggerDealerTurn(nextHands, handBets, draw.deck, dealerHand);
        return;
      }
      advanceAfterHandResolved(nextHands, handBets, nextDone, draw.deck);
      return;
    }

    if (handScore(nextHand) === 21) {
      const nextDone = handsDone.map((d, i) => (i === idx ? true : d));
      if (nextHands.length === 1) {
        setHandsDone(nextDone);
        triggerDealerTurn(nextHands, handBets, draw.deck, dealerHand);
        return;
      }
      advanceAfterHandResolved(nextHands, handBets, nextDone, draw.deck);
    }
  }, [
    activeHandIndex,
    advanceAfterHandResolved,
    dealerHand,
    deck,
    gameState,
    handBets,
    handsDone,
    playerHands,
    settle,
    triggerDealerTurn,
  ]);

  const stand = useCallback(() => {
    if (gameState !== "player") return;

    const idx = activeHandIndex;
    const nextDone = handsDone.map((d, i) => (i === idx ? true : d));

    if (playerHands.length === 1) {
      setHandsDone(nextDone);
      triggerDealerTurn(playerHands, handBets, deck, dealerHand);
      return;
    }

    const nextIdx = nextDone.findIndex((d, i) => !d);
    if (nextIdx >= 0) {
      setHandsDone(nextDone);
      setActiveHandIndex(nextIdx);
      return;
    }
    setHandsDone(nextDone);
    triggerDealerTurn(playerHands, handBets, deck, dealerHand);
  }, [
    activeHandIndex,
    dealerHand,
    deck,
    gameState,
    handBets,
    handsDone,
    playerHands,
    triggerDealerTurn,
  ]);

  const doubleDown = useCallback(() => {
    if (!canDouble) return;

    const idx = activeHandIndex;
    const unitBet = handBets[idx] ?? 0;
    const draw = drawCards(deck, 1);
    const nextHand = [...activePlayerHand, draw.cards[0]];
    const nextHands = playerHands.map((h, i) => (i === idx ? nextHand : h));
    const nextBets = handBets.map((b, i) => (i === idx ? b * 2 : b));
    setDeck(draw.deck);
    setPlayerHands(nextHands);
    setHandBets(nextBets);
    if (isWagerMode) {
      setCredits((value) => value - unitBet);
    }

    const nextDone = handsDone.map((d, i) => (i === idx ? true : d));

    if (isBust(nextHand)) {
      setHandsDone(nextDone);
      if (nextHands.length === 1) {
        settle("bust", nextBets[idx] ?? 0);
        return;
      }
      if (nextHands.every(isBust)) {
        triggerDealerTurn(nextHands, nextBets, draw.deck, dealerHand);
        return;
      }
      advanceAfterHandResolved(nextHands, nextBets, nextDone, draw.deck);
      return;
    }

    if (nextHands.length === 1) {
      setHandsDone(nextDone);
      triggerDealerTurn(nextHands, nextBets, draw.deck, dealerHand);
      return;
    }
    advanceAfterHandResolved(nextHands, nextBets, nextDone, draw.deck);
  }, [
    activeHandIndex,
    activePlayerHand,
    advanceAfterHandResolved,
    canDouble,
    dealerHand,
    deck,
    gameState,
    handBets,
    handsDone,
    isWagerMode,
    playerHands,
    setCredits,
    settle,
    triggerDealerTurn,
  ]);

  const split = useCallback(() => {
    if (!canSplitNow) return;

    const h0 = playerHands[0];
    const [c1, c2] = h0;
    const d1 = drawCards(deck, 1);
    const d2 = drawCards(d1.deck, 1);
    const unit = handBets[0] ?? 0;
    const newHands: Card[][] = [
      [c1, d1.cards[0]],
      [c2, d2.cards[0]],
    ];
    setDeck(d2.deck);
    setPlayerHands(newHands);
    setHandBets([unit, unit]);
    setHandsDone([false, false]);
    setActiveHandIndex(0);
    if (isWagerMode) {
      setCredits((value) => value - unit);
    }

    const s0 = handScore(newHands[0]);
    const s1 = handScore(newHands[1]);
    if (s0 === 21 && s1 === 21) {
      setHandsDone([true, true]);
      triggerDealerTurn(newHands, [unit, unit], d2.deck, dealerHand);
      return;
    }
    if (s0 === 21) {
      setHandsDone([true, false]);
      setActiveHandIndex(1);
      return;
    }
    if (s1 === 21) {
      setHandsDone([false, true]);
    }
  }, [
    canSplitNow,
    dealerHand,
    deck,
    handBets,
    isWagerMode,
    playerHands,
    setCredits,
    triggerDealerTurn,
  ]);

  const newHand = useCallback(() => {
    setPlayerHands([]);
    setHandBets([]);
    setHandsDone([]);
    setActiveHandIndex(0);
    setDealerHand([]);
    setOutcome(null);
    setResultCaption(null);
    setResultPayoutOverride(null);
    setGameState("idle");
  }, []);

  return (
    <View style={styles.gameRoot}>
      <View pointerEvents="none" style={styles.gameHaloTop} />
      <View pointerEvents="none" style={styles.gameHaloBottom} />

      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <View style={styles.headerBlock}>
          <View style={styles.topBar}>
            <Pressable
              onPress={onQuit}
              hitSlop={8}
              style={({ pressed }) => [styles.roundButton, pressed && styles.pressed]}
            >
              <Ionicons name="arrow-back" size={25} color="#FFFFFF" />
            </Pressable>

            <Text numberOfLines={1} adjustsFontSizeToFit style={styles.gameTitle}>
              Blackjack
            </Text>

            {isWagerMode ? (
              <View style={styles.balanceGlass}>
                <BlurView
                  intensity={Platform.OS === "ios" ? 36 : 24}
                  tint="dark"
                  style={StyleSheet.absoluteFillObject}
                />
                <View pointerEvents="none" style={styles.balanceGlassSheen} />
                <Text numberOfLines={1} adjustsFontSizeToFit style={styles.balanceText}>
                  ${(credits / 100).toFixed(2)}
                </Text>
              </View>
            ) : (
              <View style={styles.headerRightSpacer} />
            )}
          </View>
        </View>

        <View
          pointerEvents="none"
          style={[styles.table, compact && styles.tableCompact, shortScreen && styles.tableShort]}
        >
          <PlayerRail
            label="Dealer (bot)"
            score={dealerHand.length > 0 ? (gameState === "player" ? dealerVisibleScore : dealerScore) : null}
            cards={dealerHand}
            active={gameState === "dealer"}
            variant="dealer"
          />

          <MovePrompt title={moveTitle} bet={displayedBet} />

          <PlayerRail
            label={hasSplit ? "Hand 1" : "You"}
            score={playerHands[0]?.length ? handScore(playerHands[0]) : null}
            cards={playerHands[0] ?? []}
            active={gameState === "player" && activeHandIndex === 0}
            danger={isBust(playerHands[0] ?? [])}
            variant="player"
          />

          {hasSplit ? (
            <PlayerRail
              label="Hand 2"
              score={playerHands[1]?.length ? handScore(playerHands[1]) : null}
              cards={playerHands[1] ?? []}
              active={gameState === "player" && activeHandIndex === 1}
              danger={isBust(playerHands[1] ?? [])}
              variant="player"
            />
          ) : null}
        </View>

        <View style={styles.controls}>
          {gameState === "idle" ? (
            isWagerMode ? (
              <>
                <View style={styles.betConsole}>
                  <View style={styles.betConsoleTop}>
                    <Text style={styles.betConsoleLabel}>Bet stack</Text>
                    <Text style={styles.betConsoleValue}>{currentBet.toLocaleString()} CR</Text>
                  </View>

                  <MotiView
                    key={chipAnimKey}
                    from={{ opacity: 0.78 }}
                    animate={{ opacity: 1 }}
                    transition={{ type: "timing", duration: 140 }}
                    style={styles.stackPreview}
                  >
                    {betStack.length === 0 ? (
                      <Text style={styles.stackHint}>Add chips to start</Text>
                    ) : (
                      betStack.slice(-5).map((value, index) => {
                        const chip = CHIP_VALUES.find((item) => item.value === value) ?? CHIP_VALUES[0];
                        return (
                          <MotiView
                            key={`${value}-${index}`}
                            from={{ opacity: 0.75, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: "timing", duration: 120 }}
                            style={[styles.stackChip, { marginLeft: index === 0 ? 0 : -16, zIndex: index + 1 }]}
                          >
                            <PokerChip {...chip} size={42} showCrown={false} />
                          </MotiView>
                        );
                      })
                    )}
                  </MotiView>
                </View>

                <View style={styles.chipRow}>
                  {CHIP_VALUES.map((chip) => {
                    const disabled = currentBet + chip.value > credits;
                    return (
                      <ChipButton
                        key={chip.value}
                        chip={chip}
                        disabled={disabled}
                        onPress={() => addChip(chip.value)}
                      />
                    );
                  })}
                </View>

                <View style={styles.betTools}>
                  <IdleControlButton
                    label="Undo"
                    icon="undo"
                    disabled={betStack.length === 0}
                    onPress={handleUndoPress}
                  />
                  <IdleControlButton
                    label="Split"
                    icon="card-multiple-outline"
                    disabled={!canSplitNow}
                    onPress={split}
                  />
                  <IdleControlButton
                    label="Deal"
                    icon="cards-playing-outline"
                    primary
                    disabled={!canDeal}
                    onPress={handleDealPress}
                  />
                  <IdleControlButton
                    label="Clear"
                    icon="close-circle-outline"
                    muted
                    disabled={betStack.length === 0}
                    onPress={handleClearPress}
                  />
                </View>
              </>
            ) : (
              <View style={styles.normalControls}>
                <View style={styles.normalSplitDealRow}>
                  <IdleControlButton
                    label="Split"
                    icon="card-multiple-outline"
                    disabled={!canSplitNow}
                    onPress={split}
                  />
                  <IdleControlButton
                    label="Deal"
                    icon="cards-playing-outline"
                    primary
                    disabled={!canDeal}
                    onPress={handleDealPress}
                  />
                </View>
              </View>
            )
          ) : gameState === "player" ? (
            <View style={[styles.actionGrid, !isWagerMode && styles.actionGridSimple]}>
              <ActionButton label="Hit" icon="cards-playing-outline" tone="primary" onPress={hit} />
              <ActionButton label="Stand" icon="shield-outline" tone="soft" onPress={stand} />
              <ActionButton
                label="Split"
                icon="card-multiple-outline"
                tone="soft"
                disabled={!canSplitNow}
                onPress={split}
              />
              {isWagerMode ? (
                <>
                  <ActionButton
                    label="Double"
                    icon="plus-circle-outline"
                    tone="primary"
                    disabled={!canDouble}
                    onPress={doubleDown}
                  />
                  <ActionButton label="End" icon="flag-outline" tone="muted" onPress={stand} />
                </>
              ) : null}
            </View>
          ) : (
            <View style={styles.waitingPanel}>
              <MaterialCommunityIcons name="cards-playing-outline" size={20} color={V2.muted} />
              <Text style={styles.waitingText}>
                {gameState === "dealer" ? "Dealer is playing the hand" : "Waiting for next hand"}
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>

      {outcome !== null && gameState === "done" ? (
        <ResultOverlay
          outcome={outcome}
          bet={activeHandBet}
          isWagerMode={isWagerMode}
          caption={resultCaption}
          payoutOverride={resultPayoutOverride}
          onNewHand={newHand}
        />
      ) : null}

      <AdBreakModal visible={adVisible} onDone={onAdDone} />
    </View>
  );
}

function MovePrompt({
  title,
  bet,
}: {
  title: string;
  bet: number | null;
}) {
  const hasBet = bet !== null;

  return (
    <View style={styles.movePrompt}>
      <View style={[styles.moveLine, hasBet && styles.moveLineCompact]} />
      <MaterialCommunityIcons name="diamond" size={12} color="#5EA3FF" />
      <View style={[styles.moveCopy, !hasBet && styles.moveCopyWide]}>
        <Text numberOfLines={1} adjustsFontSizeToFit style={styles.moveTitle}>
          {title}
        </Text>
      </View>
      {hasBet ? (
        <View style={styles.betPill}>
          <Text style={styles.betPillLabel}>Bet</Text>
          <Text style={styles.betPillValue}>{bet.toLocaleString()}</Text>
        </View>
      ) : null}
      <MaterialCommunityIcons name="diamond" size={12} color="#5EA3FF" />
      <View style={[styles.moveLine, hasBet && styles.moveLineCompact]} />
    </View>
  );
}

function PlayerRail({
  label,
  score,
  cards,
  active,
  danger = false,
  variant,
}: {
  label: string;
  score: number | null;
  cards: Card[];
  active: boolean;
  danger?: boolean;
  variant: "dealer" | "player";
}) {
  return (
    <View
      style={[
        styles.rail,
        variant === "dealer" ? styles.dealerRail : styles.playerRail,
        active && styles.railActive,
      ]}
    >
      <View style={styles.railHeader}>
        <Text style={[styles.railLabel, variant === "player" && styles.playerRailLabel]}>
          {label}
        </Text>
        {score !== null ? (
          <View style={[styles.scoreTag, danger && styles.scoreTagDanger]}>
            <Text style={[styles.scoreText, danger && styles.scoreTextDanger]}>{score}</Text>
          </View>
        ) : null}
      </View>
      <HandDisplay cards={cards} />
    </View>
  );
}

function HandDisplay({ cards }: { cards: Card[] }) {
  if (cards.length === 0) {
    return (
      <View style={styles.emptyHand}>
        <View style={styles.emptyCard} />
        <View style={[styles.emptyCard, { marginLeft: 12 }]} />
      </View>
    );
  }

  return (
    <View style={styles.handRow}>
      {cards.map((card, index) => (
        <MotiView
          key={card.id}
          from={{
            opacity: 0,
            translateY: -24,
            scale: 0.96,
          }}
          animate={{ opacity: 1, translateY: 0, scale: 1 }}
          transition={{ type: "timing", delay: index * 70, duration: 220 }}
          style={[
            styles.cardSlot,
            index > 0 && { marginLeft: cards.length > 3 ? -30 : 12 },
          ]}
        >
          {card.hidden ? <CardBack /> : <PlayingCard card={card} />}
        </MotiView>
      ))}
    </View>
  );
}

function PlayingCard({ card }: { card: Card }) {
  const red = isRedSuit(card.suit);
  const color = red ? TABLE.red : V2.ink;
  const glyph = suitGlyph(card.suit);

  return (
    <View style={styles.card}>
      <View style={styles.cardCornerTop}>
        <Text style={[styles.cardRank, { color }]}>{card.rank}</Text>
        <Text style={[styles.cardSuitTiny, { color }]}>{glyph}</Text>
      </View>
      <Text style={[styles.cardSuitCenter, { color }]}>{glyph}</Text>
      <View style={styles.cardCornerBottom}>
        <Text style={[styles.cardRank, { color }]}>{card.rank}</Text>
        <Text style={[styles.cardSuitTiny, { color }]}>{glyph}</Text>
      </View>
    </View>
  );
}

function CardBack() {
  return (
    <View style={[styles.card, styles.cardBack]}>
      <View style={styles.cardBackInset}>
        <MaterialCommunityIcons name="cards-diamond-outline" size={28} color={TABLE.feltInk} />
      </View>
    </View>
  );
}

function ChipButton({
  chip,
  disabled,
  onPress,
}: {
  chip: Chip;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Add ${chip.value} credit chip`}
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.chip,
        disabled && styles.disabled,
        pressed && !disabled && styles.chipPressed,
      ]}
    >
      <PokerChip {...chip} size={56} showCrown={chip.value >= 100} />
    </Pressable>
  );
}

function IdleControlButton({
  label,
  icon,
  primary = false,
  muted = false,
  disabled = false,
  onPress,
}: {
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  primary?: boolean;
  muted?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  const iconColor = muted ? "rgba(255,255,255,0.72)" : "#5EA3FF";

  return (
    <TouchableOpacity
      activeOpacity={0.72}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={[
        styles.idleControlButton,
        primary && styles.idleControlButtonPrimary,
        muted && styles.idleControlButtonMuted,
        disabled && styles.disabled,
      ]}
    >
      <MaterialCommunityIcons name={icon} size={30} color={iconColor} />
      <Text style={styles.idleControlText}>{label}</Text>
    </TouchableOpacity>
  );
}

function ActionButton({
  label,
  icon,
  tone,
  disabled = false,
  badge,
  onPress,
}: {
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  tone: "primary" | "soft" | "muted";
  disabled?: boolean;
  badge?: string;
  onPress: () => void;
}) {
  const iconColor =
    tone === "muted" ? "rgba(255,255,255,0.72)" : "#5EA3FF";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.actionFrame,
        tone === "primary" && styles.actionFramePrimary,
        tone === "muted" && styles.actionFrameMuted,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <View pointerEvents="none" style={styles.actionButtonContent}>
        <View style={styles.actionIconWrap}>
          <MaterialCommunityIcons name={icon} size={34} color={iconColor} />
          {badge ? (
            <View style={styles.actionBadge}>
              <Text style={styles.actionBadgeText}>{badge}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.actionButtonText}>{label}</Text>
      </View>
    </Pressable>
  );
}

function ResultOverlay({
  outcome,
  bet,
  isWagerMode,
  caption,
  payoutOverride,
  onNewHand,
}: {
  outcome: NonNullable<Outcome>;
  bet: number;
  isWagerMode: boolean;
  caption: string | null;
  payoutOverride: string | null;
  onNewHand: () => void;
}) {
  const meta = OUTCOME_META[outcome];
  const defaultPayout =
    outcome === "blackjack" ? Math.round(bet * 2.5) :
    outcome === "win" ? bet * 2 :
    outcome === "push" ? bet : 0;
  const subText =
    caption && caption.length > 0
      ? caption
      : isWagerMode
        ? meta.sub
        : NORMAL_OUTCOME_COPY[outcome];
  const payoutLine = isWagerMode
    ? (payoutOverride ?? `${defaultPayout > 0 ? defaultPayout.toLocaleString() : "0"} CR`)
    : "Normal";

  return (
    <Modal transparent animationType="none" statusBarTranslucent>
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: "timing", duration: 200 }}
        style={styles.resultScrim}
      >
        <MotiView
          from={{ opacity: 0, scale: 0.9, translateY: 16 }}
          animate={{ opacity: 1, scale: 1, translateY: 0 }}
          transition={{ type: "timing", delay: 40, duration: 180 }}
          style={styles.resultCard}
        >
          <View style={[styles.resultIcon, { backgroundColor: `${meta.color}22` }]}>
            <MaterialCommunityIcons name={meta.icon} size={34} color={meta.color} />
          </View>
          <Text style={[styles.resultLabel, { color: meta.color }]}>{meta.label}</Text>
          <Text style={styles.resultSub}>{subText}</Text>

          <View style={styles.resultPayout}>
            <Text style={styles.resultPayoutLabel}>
              {isWagerMode ? "Payout" : "Mode"}
            </Text>
            <Text style={styles.resultPayoutValue}>{payoutLine}</Text>
          </View>

          <View style={styles.resultButtonFrame}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Continue"
              onPress={onNewHand}
              style={({ pressed }) => [styles.resultButton, pressed && styles.pressed]}
            >
              <View pointerEvents="none" style={styles.resultButtonContent}>
                <MaterialCommunityIcons name="refresh" size={20} color="#FFFFFF" />
                <Text numberOfLines={1} adjustsFontSizeToFit style={styles.resultButtonText}>
                  Continue
                </Text>
              </View>
            </Pressable>
          </View>
        </MotiView>
      </MotiView>
    </Modal>
  );
}

function AdBreakModal({ visible, onDone }: { visible: boolean; onDone: () => void }) {
  const [seconds, setSeconds] = useState(AD_SECS);

  useEffect(() => {
    if (!visible) return;

    setSeconds(AD_SECS);
    const interval = setInterval(() => {
      setSeconds((value) => Math.max(value - 1, 0));
    }, 1000);
    const timeout = setTimeout(onDone, AD_SECS * 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [visible, onDone]);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.resultScrim}>
        <View style={styles.adCard}>
          <View style={styles.adBadge}>
            <Ionicons name="play-circle" size={14} color={V2.ink} />
            <Text style={styles.adBadgeText}>Short break</Text>
          </View>
          <MaterialCommunityIcons name="movie-open-play-outline" size={46} color={V2.ink} />
          <Text style={styles.adTitle}>Ad playing</Text>
          <Text style={styles.adSub}>Your table is paused and ready when the break ends.</Text>
          <Text style={styles.adCountdown}>{seconds}s</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  gameRoot: {
    flex: 1,
    backgroundColor: "#020609",
  },
  gameHaloTop: {
    position: "absolute",
    top: -110,
    left: -90,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "rgba(94,163,255,0.12)",
  },
  gameHaloBottom: {
    position: "absolute",
    right: -130,
    bottom: 120,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(94,163,255,0.08)",
  },
  headerBlock: {
    paddingHorizontal: 22,
    paddingTop: 2,
    alignItems: "center",
  },
  topBar: {
    minHeight: 50,
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
  },
  roundButton: {
    width: 56,
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
  gameTitle: {
    ...typography.bold,
    flex: 1,
    minWidth: 0,
    fontSize: 27,
    lineHeight: 32,
    color: "#FFFFFF",
    letterSpacing: 0,
    textAlign: "center",
  },
  balanceGlass: {
    overflow: "hidden",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: "rgba(255,255,255,0.28)",
    maxWidth: 118,
    shadowColor: "#000000",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  balanceGlassSheen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.12)",
  },
  balanceText: {
    ...typography.bold,
    fontSize: 15,
    lineHeight: 19,
    color: "rgba(255,255,255,0.94)",
    letterSpacing: 0.2,
    textAlign: "center",
  },
  headerRightSpacer: {
    width: 56,
    height: 56,
  },
  table: {
    flex: 1,
    marginHorizontal: 22,
    justifyContent: "center",
    position: "relative",
    zIndex: 0,
  },
  tableCompact: {
    marginHorizontal: 18,
  },
  tableShort: {
    marginHorizontal: 18,
  },
  rail: {
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.055)",
    overflow: "hidden",
  },
  dealerRail: {
    width: "100%",
    minHeight: 196,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 14,
  },
  playerRail: {
    width: "100%",
    minHeight: 174,
    borderRadius: 24,
    borderColor: "rgba(76,148,255,0.52)",
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 18,
    backgroundColor: "rgba(6,18,35,0.72)",
  },
  railActive: {
    borderColor: "rgba(94,163,255,0.72)",
    backgroundColor: "rgba(15,39,68,0.72)",
  },
  railHeader: {
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  railLabel: {
    ...typography.bold,
    fontSize: 14,
    color: "rgba(255,255,255,0.58)",
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  playerRailLabel: {
    color: "#4C94FF",
  },
  scoreTag: {
    minWidth: 32,
    minHeight: 24,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(94,163,255,0.42)",
    backgroundColor: "rgba(94,163,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  scoreTagDanger: {
    backgroundColor: "#FFF1F1",
    borderColor: "rgba(215,38,61,0.22)",
  },
  scoreText: {
    ...typography.bold,
    fontSize: 12,
    color: "#FFFFFF",
    letterSpacing: 0,
  },
  scoreTextDanger: {
    color: TABLE.red,
  },
  movePrompt: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 8,
  },
  moveLine: {
    flex: 0.8,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  moveLineCompact: {
    flex: 0.45,
  },
  moveCopy: {
    flex: 2.8,
    minWidth: 0,
    alignItems: "center",
  },
  moveCopyWide: {
    flex: 4.4,
  },
  moveTitle: {
    ...typography.bold,
    maxWidth: "100%",
    fontSize: 20,
    lineHeight: 24,
    color: "#FFFFFF",
    letterSpacing: 0,
    textAlign: "center",
  },
  betPill: {
    minWidth: 62,
    minHeight: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(94,163,255,0.38)",
    backgroundColor: "rgba(94,163,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  betPillLabel: {
    ...typography.bold,
    fontSize: 9,
    color: "rgba(255,255,255,0.52)",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  betPillValue: {
    ...typography.bold,
    fontSize: 13,
    color: "#5EA3FF",
    letterSpacing: 0,
  },
  controls: {
    paddingHorizontal: 22,
    paddingTop: 6,
    paddingBottom: 8,
    gap: 8,
    position: "relative",
    zIndex: 20,
    elevation: 20,
  },
  betConsole: {
    minHeight: 46,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  betConsoleTop: {
    width: 92,
  },
  betConsoleLabel: {
    ...typography.semibold,
    fontSize: 12,
    color: "rgba(255,255,255,0.56)",
  },
  betConsoleValue: {
    ...typography.bold,
    marginTop: 2,
    fontSize: 17,
    color: "#FFFFFF",
    letterSpacing: 0,
  },
  chipRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  chip: {
    flex: 1,
    minHeight: 64,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  chipPressed: {
    transform: [{ scale: 0.94 }],
  },
  disabled: {
    opacity: 0.42,
  },
  betTools: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  normalControls: {
    minHeight: 104,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.07)",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  normalControlsText: {
    ...typography.semibold,
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    lineHeight: 18,
    color: "rgba(255,255,255,0.66)",
    letterSpacing: 0,
  },
  normalSplitDealRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "stretch",
    gap: 12,
    minHeight: 76,
  },
  idleControlButton: {
    flex: 1,
    minHeight: 70,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(94,163,255,0.28)",
    backgroundColor: "rgba(12,33,58,0.76)",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  idleControlButtonPrimary: {
    borderColor: "rgba(94,163,255,0.5)",
    backgroundColor: "rgba(15,47,86,0.9)",
  },
  idleControlButtonMuted: {
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  idleControlText: {
    ...typography.bold,
    fontSize: 14,
    color: "#FFFFFF",
    letterSpacing: 0,
    textAlign: "center",
  },
  stackPreview: {
    flex: 1,
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  stackHint: {
    ...typography.semibold,
    fontSize: 12,
    color: "rgba(255,255,255,0.42)",
  },
  stackChip: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  actionGrid: {
    flexDirection: "row",
    gap: 10,
  },
  actionGridSimple: {
    paddingHorizontal: 10,
  },
  actionFrame: {
    flex: 1,
    minHeight: 70,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(94,163,255,0.28)",
    backgroundColor: "rgba(12,33,58,0.76)",
    padding: 2,
  },
  actionFramePrimary: {
    borderColor: "rgba(94,163,255,0.5)",
    backgroundColor: "rgba(15,47,86,0.9)",
  },
  actionFrameMuted: {
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  actionButtonContent: {
    minHeight: 64,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  actionIconWrap: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBadge: {
    position: "absolute",
    top: -6,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#3F8CFF",
    alignItems: "center",
    justifyContent: "center",
  },
  actionBadgeText: {
    ...typography.bold,
    fontSize: 14,
    color: "#FFFFFF",
  },
  actionButtonText: {
    ...typography.bold,
    fontSize: 14,
    color: "#FFFFFF",
    letterSpacing: 0,
    textAlign: "center",
  },
  waitingPanel: {
    minHeight: 70,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.10)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  waitingText: {
    ...typography.semibold,
    fontSize: 13,
    color: "rgba(255,255,255,0.62)",
  },
  emptyHand: {
    minHeight: 96,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.42,
  },
  emptyCard: {
    width: 62,
    height: 88,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  handRow: {
    minHeight: 98,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  cardSlot: {},
  card: {
    width: 64,
    height: 92,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.20)",
    backgroundColor: "#F8F8F7",
    shadowColor: "#000000",
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
  cardCornerTop: {
    position: "absolute",
    top: 7,
    left: 8,
    alignItems: "center",
  },
  cardCornerBottom: {
    position: "absolute",
    right: 8,
    bottom: 7,
    alignItems: "center",
    transform: [{ rotate: "180deg" }],
  },
  cardRank: {
    ...typography.bold,
    fontSize: 16,
    lineHeight: 18,
  },
  cardSuitTiny: {
    fontSize: 14,
    lineHeight: 16,
  },
  cardSuitCenter: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    marginTop: -19,
    textAlign: "center",
    fontSize: 36,
  },
  cardBack: {
    backgroundColor: "#0F315D",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },
  cardBackInset: {
    flex: 1,
    alignSelf: "stretch",
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  resultScrim: {
    flex: 1,
    backgroundColor: "rgba(10,10,10,0.38)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: GUTTER,
    paddingVertical: 18,
  },
  resultCard: {
    width: "100%",
    maxWidth: 330,
    maxHeight: "92%",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: SOFT_BORDER,
    backgroundColor: "#FFFFFF",
    padding: 18,
    alignItems: "center",
    gap: 10,
  },
  resultIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
  },
  resultLabel: {
    ...typography.bold,
    fontSize: 29,
    lineHeight: 33,
    letterSpacing: -0.8,
    textAlign: "center",
  },
  resultSub: {
    ...typography.semibold,
    marginTop: -6,
    fontSize: 13,
    color: V2.muted,
    textAlign: "center",
  },
  resultPayout: {
    alignSelf: "stretch",
    minHeight: 50,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: HAIRLINE,
    backgroundColor: V2.bg,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  resultPayoutLabel: {
    ...typography.semibold,
    fontSize: 12,
    color: V2.muted,
  },
  resultPayoutValue: {
    ...typography.bold,
    fontSize: 18,
    color: V2.ink,
    letterSpacing: -0.4,
  },
  resultButtonFrame: {
    alignSelf: "stretch",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(37,99,235,0.28)",
    backgroundColor: "#FFFFFF",
    padding: 2,
  },
  resultButton: {
    minHeight: 52,
    borderRadius: 20,
    backgroundColor: V2.blueDeep,
    outlineColor: "transparent",
    outlineStyle: "solid",
    outlineWidth: 0,
  },
  resultButtonContent: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  resultButtonText: {
    ...typography.bold,
    fontSize: 16,
    color: "#FFFFFF",
    letterSpacing: 0,
  },
  adCard: {
    width: "100%",
    maxWidth: 320,
    minHeight: 272,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: SOFT_BORDER,
    backgroundColor: "#FFFFFF",
    padding: 22,
    alignItems: "center",
    justifyContent: "space-between",
  },
  adBadge: {
    alignSelf: "flex-start",
    minHeight: 30,
    paddingHorizontal: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: SOFT_BORDER,
    backgroundColor: TABLE.felt,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  adBadgeText: {
    ...typography.bold,
    fontSize: 11,
    color: V2.ink,
  },
  adTitle: {
    ...typography.bold,
    fontSize: 25,
    color: V2.ink,
    letterSpacing: -0.6,
  },
  adSub: {
    ...typography.semibold,
    fontSize: 13,
    color: V2.muted,
    textAlign: "center",
    lineHeight: 18,
  },
  adCountdown: {
    ...typography.bold,
    fontSize: 19,
    color: TABLE.feltDeep,
  },
});
