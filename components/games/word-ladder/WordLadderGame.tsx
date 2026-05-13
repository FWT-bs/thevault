import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { V2 } from "../../../constants/glassPalette";
import { typography } from "../../../constants/typography";
import {
  createGameRoute,
  type GameModeOption,
  type GameplayScreenProps,
} from "../createGameRoute";
import { InAppGameShell, type SecondaryAction } from "../_template/InAppGameShell";

type WordLadderModeId = "classic" | "challenge" | "expert";

const MODE_OPTIONS: ReadonlyArray<GameModeOption<WordLadderModeId>> = [
  {
    id: "classic",
    label: "Classic",
    description: "Four rungs to start; ladder lengthens every level.",
  },
  {
    id: "challenge",
    label: "Challenge",
    description: "Begin at level 3 with six rungs; faster ramp.",
  },
  {
    id: "expert",
    label: "Expert",
    description: "Begin at level 5 on a full eight-rung ladder.",
  },
];

const MODE_START_LEVEL: Record<WordLadderModeId, number> = {
  classic: 1,
  challenge: 3,
  expert: 5,
};

const MAX_LADDER_SIZE = 8;

interface Rung {
  clue: string;
  answer: string;
}

const WORD_POOL = Array.from(
  new Set(
    [
      "BAND", "BANE", "BARN", "BARK", "BORN", "BOND", "BEND", "BENT", "BEST",
      "BUST", "BUSY", "BONY", "BODY", "COLD", "CORD", "CARD", "CARE", "CANE",
      "CONE", "COIN", "JOIN", "JOLT", "BOLT", "BOLD", "GOLD", "GOLF", "GULF",
      "GULL", "FULL", "FALL", "BALL", "BELL", "BILL", "SILL", "SALT", "MALT",
      "MELT", "MEND", "SEND", "SEED", "SEEN", "SEEK", "PEEK", "PEAK", "PEAR",
      "DEAR", "DEER", "BEER", "BEAR", "GEAR", "YEAR", "YARN", "YARD", "HARD",
      "WARD", "WORD", "WORK", "PORK", "PARK", "DARK", "LARK", "LARD", "LORD",
      "LOAD", "LEAD", "HEAD", "HEAL", "SEAL", "TEAL", "TELL", "TALL", "TAIL",
      "MAIL", "MAIN", "PAIN", "GAIN", "RAIN", "RAIL", "SAIL", "SOIL", "COIL",
      "FOIL", "FAIL", "WALL", "WELL", "WELD", "WILD", "MILD", "MILE", "PILE",
      "PINE", "FINE", "FIND", "MIND", "MINT", "TEND", "TENT", "TEST", "TEXT",
      "NEXT", "NEWT", "NEWS", "SEWS", "SEAS", "SEAT", "MEAT", "MEET", "FEET",
      "FELT", "BELT", "LENT", "LEND", "LAND", "SAND", "HAND", "HIND", "HINT",
      "HUNT", "HURT", "CURT", "CART", "CORK", "FORK", "FORM", "WORM", "WARM",
      "SWAM", "SLAM", "SLAB", "SCAB", "SCAR", "STAR", "STIR", "STAY", "CLAY",
      "PLAY", "PRAY", "GRAY", "GRAB", "CRAB", "CRIB", "DRIP", "DROP", "CROP",
      "CROW", "BROW", "BLOW", "GLOW", "SLOW", "SNOW", "SHOW", "SHOT", "SPOT",
      "SPIN", "SKIN", "SKIM", "SLIM", "SLID", "SAID", "PAID", "MAID", "NAIL",
      "SOAR", "BOAR", "ROAR", "ROAD", "TOAD", "GOAD", "COLT", "BOWL", "HOWL",
      "FOUL", "SOUL", "SOUR", "FOUR", "TOUR", "YOUR", "SURE", "CURE", "CORE",
      "FIRM", "FIRE", "HIRE", "HARE", "HATE", "LATE", "FATE", "DATE", "DATA",
      "DART", "PART", "PORT", "SORT", "SORE", "SIRE", "SILO",
    ].filter((w) => w.length === 4),
  ),
);

const WORD_HINTS: Record<string, string> = {
  BAND: "A music group", BANE: "A major source of trouble", BARN: "A farm building",
  BARK: "The outside of a tree", BORN: "Brought into life", BOND: "A close connection",
  BEND: "To curve", BENT: "Not straight", BEST: "Better than all others",
  BUST: "To break or catch", BUSY: "Having a lot to do", BONY: "Thin, with visible bones",
  BODY: "Your physical form", COLD: "Not warm", CORD: "A thick string",
  CARD: "A small flat paper", CARE: "To look after", CANE: "A walking stick",
  CONE: "A pointed shape", COIN: "A piece of money", JOIN: "To connect together",
  JOLT: "A sudden shock", BOLT: "Metal fastener or to run", BOLD: "Confident and brave",
  GOLD: "Valuable yellow metal", GOLF: "Club-and-ball sport", GULF: "Large sea inlet",
  GULL: "A seabird", FULL: "Holding as much as possible", FALL: "To drop down",
  BALL: "A round object", BELL: "A ringing object", BILL: "A payment statement",
  SILL: "Bottom edge of a window", SALT: "A common seasoning", MALT: "Germinated grain",
  MELT: "To become liquid", MEND: "To repair", SEND: "To dispatch",
  SEED: "A plant starter", SEEN: "Noticed with eyes", SEEK: "To look for",
  PEEK: "To look quickly", PEAK: "The top point", PEAR: "A sweet fruit",
  DEAR: "Beloved or valued", DEER: "Hoofed forest animal", BEER: "An alcoholic drink",
  BEAR: "A large mammal", GEAR: "Equipment", YEAR: "Twelve months",
  YARN: "Thread for knitting", YARD: "An outdoor area", HARD: "Not soft",
  WARD: "Hospital section", WORD: "A unit of language", WORK: "Effort to achieve",
  PORK: "Meat from a pig", PARK: "A public green space", DARK: "With little light",
  LARK: "A songbird", LARD: "Rendered pork fat", LORD: "A titled man",
  LOAD: "A heavy amount carried", LEAD: "To guide", HEAD: "Top part of the body",
  HEAL: "To recover", SEAL: "To close, or a marine animal", TEAL: "A blue-green color",
  TELL: "To say", TALL: "High in height", TAIL: "Rear appendage",
  MAIL: "Post", MAIN: "Most important", PAIN: "Physical suffering",
  GAIN: "To obtain", RAIN: "Water falling from clouds", RAIL: "Long metal bar for trains",
  SAIL: "Cloth that catches wind", SOIL: "Earth", COIL: "A series of loops",
  FOIL: "Thin metal sheet", FAIL: "To not succeed", WALL: "A vertical structure",
  WELL: "A deep water shaft", WELD: "To fuse metal", WILD: "Untamed",
  MILD: "Not strong", MILE: "A unit of distance", PILE: "A heap",
  PINE: "An evergreen tree", FINE: "Of high quality", FIND: "To discover",
  MIND: "The thinking part", MINT: "An herb", TEND: "To care for",
  TENT: "A portable shelter", TEST: "An exam", TEXT: "Written words",
  NEXT: "Coming after", NEWT: "Small amphibian", NEWS: "Current reports",
  SEWS: "Stitches cloth", SEAS: "Large bodies of salt water", SEAT: "A place to sit",
  MEAT: "Animal flesh used as food", MEET: "To come together", FEET: "Plural of foot",
  FELT: "Fabric of pressed fibers", BELT: "A waist strap", LENT: "Christian season",
  LEND: "To give temporarily", LAND: "Ground", SAND: "Beach grains",
  HAND: "End of your arm", HIND: "Rear part", HINT: "A small clue",
  HUNT: "To search for game", HURT: "To cause pain", CURT: "Rudely brief",
  CART: "A wheeled carrier", CORK: "Bottle stopper material", FORK: "Eating utensil",
  FORM: "Shape", WORM: "Small crawling invertebrate", WARM: "Slightly hot",
  SWAM: "Past tense of swim", SLAM: "To shut forcefully", SLAB: "A thick flat piece",
  SCAB: "Crust over a wound", SCAR: "A healed skin mark", STAR: "A bright object in space",
  STIR: "To mix", STAY: "To remain", CLAY: "Moldable earth material",
  PLAY: "To have fun", PRAY: "To speak to a deity", GRAY: "A neutral color",
  GRAB: "To seize quickly", CRAB: "A sea creature with claws", CRIB: "A baby bed",
  DRIP: "To fall in drops", DROP: "To let fall", CROP: "Farm produce",
  CROW: "A black bird", BROW: "Above the eye", BLOW: "To move air",
  GLOW: "Steady light", SLOW: "Not fast", SNOW: "Frozen precipitation",
  SHOW: "To display", SHOT: "One attempt", SPOT: "A small mark",
  SPIN: "To rotate", SKIN: "Outer body layer", SKIM: "To move lightly over a surface",
  SLIM: "Thin", SLID: "Past tense of slide", SAID: "Past tense of say",
  PAID: "Gave money for something", MAID: "A domestic worker", NAIL: "Fingertip plate or fastener",
  SOAR: "To fly high", BOAR: "A wild pig", ROAR: "A loud deep sound",
  ROAD: "A route for travel", TOAD: "Bumpy-skinned amphibian", GOAD: "To provoke",
  COLT: "A young male horse", BOWL: "A round dish", HOWL: "A long loud cry",
  FOUL: "Offensive or dirty", SOUL: "The spiritual self", SOUR: "Acidic taste",
  FOUR: "Number after three", TOUR: "A trip through places", YOUR: "Belonging to you",
  SURE: "Certain", CURE: "To heal", CORE: "The central part",
  FIRM: "Solid and stable", FIRE: "Flames and heat", HIRE: "To employ",
  HARE: "A rabbit-like animal", HATE: "To strongly dislike", LATE: "Not on time",
  FATE: "Destiny", DATE: "Day on a calendar", DATA: "Facts and information",
  DART: "A small pointed missile", PART: "A piece of something", PORT: "A harbor",
  SORT: "To arrange", SORE: "Painful", SIRE: "A male parent animal",
  SILO: "Tall farm storage tower",
};

function buildWordGraph(words: string[]) {
  const buckets = new Map<string, string[]>();
  for (const word of words) {
    for (let i = 0; i < word.length; i++) {
      const key = `${word.slice(0, i)}*${word.slice(i + 1)}`;
      const list = buckets.get(key);
      if (list) list.push(word);
      else buckets.set(key, [word]);
    }
  }
  const graph = new Map<string, string[]>();
  for (const word of words) {
    const neighborSet = new Set<string>();
    for (let i = 0; i < word.length; i++) {
      const key = `${word.slice(0, i)}*${word.slice(i + 1)}`;
      for (const peer of buckets.get(key) ?? []) {
        if (peer !== word) neighborSet.add(peer);
      }
    }
    graph.set(word, [...neighborSet]);
  }
  return graph;
}

const WORD_GRAPH = buildWordGraph(WORD_POOL);

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function rungCountForLevel(level: number) {
  if (level <= 1) return 4;
  if (level === 2) return 5;
  if (level === 3) return 6;
  if (level === 4) return 7;
  return MAX_LADDER_SIZE;
}

function generateLevelWords(level: number) {
  const rng = mulberry32(level * 104729);
  for (let attempt = 0; attempt < 200; attempt++) {
    const start = WORD_POOL[Math.floor(rng() * WORD_POOL.length)];
    const path = [start];
    const used = new Set<string>([start]);
    while (path.length < MAX_LADDER_SIZE) {
      const current = path[path.length - 1];
      const nextChoices = (WORD_GRAPH.get(current) ?? []).filter((w) => !used.has(w));
      if (!nextChoices.length) break;
      const pick = nextChoices[Math.floor(rng() * nextChoices.length)];
      used.add(pick);
      path.push(pick);
    }
    if (path.length === MAX_LADDER_SIZE) return path;
  }
  return ["COIN", "JOIN", "JOLT", "BOLT", "BOLD", "GOLD", "GOLF", "GULF"];
}

function buildHint(answer: string): string {
  return WORD_HINTS[answer] ?? "Common four-letter word";
}

function generateRungsForLevel(level: number): Rung[] {
  const rungCount = rungCountForLevel(level);
  const words = generateLevelWords(level);
  return words.slice(0, rungCount).map((answer, i) => ({
    clue: i === 0 ? "Starting rung — locked in" : buildHint(answer),
    answer,
  }));
}

function buildInitialPlacements(rungs: Rung[]): (string | null)[] {
  return rungs.map((rung, i) => (i === 0 ? rung.answer : null));
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface WordChipProps {
  word: string;
  isSelected: boolean;
  isDragging: boolean;
  accent: string;
  accentInk: string;
  onTap: (word: string) => void;
  onDragStart: (word: string, pageX: number, pageY: number) => void;
  onDragMove: (pageX: number, pageY: number) => void;
  onDragEnd: (pageX: number, pageY: number) => void;
}

function WordChip({
  word,
  isSelected,
  isDragging,
  accent,
  accentInk,
  onTap,
  onDragStart,
  onDragMove,
  onDragEnd,
}: WordChipProps) {
  const p = useRef({ word, onTap, onDragStart, onDragMove, onDragEnd });
  useEffect(() => {
    p.current = { word, onTap, onDragStart, onDragMove, onDragEnd };
  });

  const hasDraggedRef = useRef(false);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 4 || Math.abs(gs.dy) > 4,
      onPanResponderGrant: (e) => {
        hasDraggedRef.current = false;
        p.current.onDragStart(p.current.word, e.nativeEvent.pageX, e.nativeEvent.pageY);
      },
      onPanResponderMove: (e, gs) => {
        if (Math.abs(gs.dx) > 4 || Math.abs(gs.dy) > 4) hasDraggedRef.current = true;
        p.current.onDragMove(e.nativeEvent.pageX, e.nativeEvent.pageY);
      },
      onPanResponderRelease: (e, gs) => {
        if (!hasDraggedRef.current && Math.abs(gs.dx) < 4 && Math.abs(gs.dy) < 4) {
          p.current.onDragEnd(-1, -1);
          p.current.onTap(p.current.word);
        } else {
          p.current.onDragEnd(e.nativeEvent.pageX, e.nativeEvent.pageY);
        }
        hasDraggedRef.current = false;
      },
      onPanResponderTerminate: () => {
        p.current.onDragEnd(-1, -1);
        hasDraggedRef.current = false;
      },
    }),
  ).current;

  return (
    <View
      {...pan.panHandlers}
      style={[
        styles.wordChip,
        isSelected && { backgroundColor: accent, borderColor: accentInk },
        isDragging && styles.wordChipDragging,
      ]}
    >
      <Text style={[styles.wordChipText, isSelected && { color: "#FFFFFF" }]}>{word}</Text>
    </View>
  );
}

function WordLadderGameplay({
  title,
  modeId,
  modeLabel,
  accent,
  accentSoft,
  accentInk,
  onQuit,
  onFinish,
}: GameplayScreenProps<WordLadderModeId>) {
  const { width } = useWindowDimensions();
  const isCompact = width < 380;
  const initialLevel = MODE_START_LEVEL[modeId];

  const [level, setLevel] = useState(initialLevel);
  const [score, setScore] = useState(0);
  const [paused, setPaused] = useState(false);

  const rungs = useMemo(() => generateRungsForLevel(level), [level]);
  const [placements, setPlacements] = useState<(string | null)[]>(() =>
    buildInitialPlacements(rungs),
  );
  const placementsRef = useRef(placements);
  useEffect(() => {
    placementsRef.current = placements;
  }, [placements]);

  const bankOrder = useMemo(() => {
    const rng = mulberry32(level * 4099 + modeId.length * 31);
    return shuffle(
      rungs.map((r) => r.answer).filter((_, i) => i !== 0),
      rng,
    );
  }, [rungs, level, modeId]);

  const [selectedWord, setSelectedWord] = useState<string | null>(null);

  const dragX = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const [draggingWord, setDraggingWord] = useState<string | null>(null);
  const draggingWordRef = useRef<string | null>(null);

  const rungDropRefs = useRef<(View | null)[]>([]);
  const rungDropLayouts = useRef<({ x: number; y: number; width: number; height: number } | null)[]>([]);

  useEffect(() => {
    setLevel(MODE_START_LEVEL[modeId]);
    setScore(0);
  }, [modeId]);

  useEffect(() => {
    setPlacements(buildInitialPlacements(rungs));
    setSelectedWord(null);
    setDraggingWord(null);
    draggingWordRef.current = null;
    rungDropRefs.current = new Array(rungs.length).fill(null);
    rungDropLayouts.current = new Array(rungs.length).fill(null);
  }, [rungs]);

  const allSolved = useMemo(
    () => placements.every((p, i) => p === rungs[i].answer),
    [placements, rungs],
  );

  const placedCount = placements.filter(Boolean).length;

  const measureDropTargets = useCallback(() => {
    rungDropRefs.current.forEach((ref, i) => {
      ref?.measureInWindow((x, y, w, h) => {
        rungDropLayouts.current[i] = { x, y, width: w, height: h };
      });
    });
  }, []);

  const placeWord = useCallback(
    (word: string, rungIndex: number) => {
      const target = rungs[rungIndex].answer;
      const correct = word === target;
      setPlacements((prev) => {
        const next = [...prev];
        const prevRung = next.indexOf(word);
        if (prevRung >= 0) next[prevRung] = null;
        next[rungIndex] = word;
        return next;
      });
      setSelectedWord(null);
      setScore((value) => value + (correct ? 18 + level * 2 : 4));
    },
    [rungs, level],
  );

  const handleRungTap = useCallback(
    (i: number) => {
      if (i === 0) return;
      const currentlyPlaced = placementsRef.current[i];
      if (selectedWord) {
        placeWord(selectedWord, i);
      } else if (currentlyPlaced) {
        setPlacements((prev) => {
          const next = [...prev];
          next[i] = null;
          return next;
        });
        setSelectedWord(currentlyPlaced);
      }
    },
    [selectedWord, placeWord],
  );

  const handleWordTap = useCallback((word: string) => {
    setSelectedWord((prev) => (prev === word ? null : word));
  }, []);

  const handleDragStart = useCallback(
    (word: string, pageX: number, pageY: number) => {
      draggingWordRef.current = word;
      setDraggingWord(word);
      setSelectedWord(null);
      dragX.setValue(pageX - 40);
      dragY.setValue(pageY - 20);
      measureDropTargets();
    },
    [dragX, dragY, measureDropTargets],
  );

  const handleDragMove = useCallback(
    (pageX: number, pageY: number) => {
      dragX.setValue(pageX - 40);
      dragY.setValue(pageY - 20);
    },
    [dragX, dragY],
  );

  const handleDragEnd = useCallback(
    (pageX: number, pageY: number) => {
      const word = draggingWordRef.current;
      draggingWordRef.current = null;
      setDraggingWord(null);
      if (!word || pageX < 0) return;
      const targetIndex = rungDropLayouts.current.findIndex((layout) => {
        if (!layout) return false;
        return (
          pageX >= layout.x &&
          pageX <= layout.x + layout.width &&
          pageY >= layout.y &&
          pageY <= layout.y + layout.height
        );
      });
      if (targetIndex > 0) placeWord(word, targetIndex);
    },
    [placeWord],
  );

  const restartLevel = useCallback(() => {
    setPlacements(buildInitialPlacements(rungs));
    setSelectedWord(null);
  }, [rungs]);

  const continueToNextLevel = useCallback(() => {
    setScore((value) => value + 60 + level * 10);
    setLevel((value) => value + 1);
  }, [level]);

  const claimAndExit = useCallback(() => {
    onFinish(score);
  }, [onFinish, score]);

  const wordsInBank = bankOrder.filter((w) => !placements.includes(w));

  const hudPills = useMemo(
    () => [
      { label: "Score", value: String(score) },
      { label: "Level", value: String(level) },
      { label: "Rungs", value: `${placedCount}/${rungs.length}` },
    ],
    [score, level, placedCount, rungs.length],
  );

  const secondaryActions: SecondaryAction[] = useMemo(
    () => [
      {
        label: "Restart",
        icon: "refresh",
        onPress: restartLevel,
      },
      {
        label: selectedWord ? "Cancel pick" : "Hint",
        icon: selectedWord ? "close-circle-outline" : "bulb-outline",
        onPress: () => setSelectedWord(null),
        disabled: !selectedWord,
      },
    ],
    [restartLevel, selectedWord],
  );

  const nextRungCount = rungCountForLevel(level + 1);
  const ladderGrowsNext = nextRungCount !== rungs.length;

  return (
    <>
      <InAppGameShell
        title={title}
        subtitle={`${modeLabel} · Level ${level}`}
        accent={accent}
        accentSoft={accentSoft}
        accentInk={accentInk}
        hudPills={hudPills}
        levelComplete={
          allSolved
            ? {
                title: `Level ${level} complete`,
                subtitle: ladderGrowsNext
                  ? `${rungs.length} rungs · Score ${score} · Next: level ${level + 1} (${nextRungCount} rungs)`
                  : `${rungs.length} rungs · Score ${score} · Next: level ${level + 1}`,
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
        <ScrollView
          contentContainerStyle={styles.gameplayScroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.ladderContainer}>
            {rungs.map((rung, i) => {
              const placed = placements[i];
              const isSolved = placed === rung.answer;
              const isWrongPlace = placed !== null && !isSolved;
              const isTarget = selectedWord !== null && !placed && i > 0;
              return (
                <View
                  key={i}
                  ref={(ref) => {
                    rungDropRefs.current[i] = ref;
                  }}
                  style={styles.rungRowWrapper}
                >
                  <Pressable
                    onPress={() => handleRungTap(i)}
                    disabled={i === 0}
                    style={({ pressed }) => [
                      styles.rungRow,
                      isSolved && { borderColor: "rgba(34,197,94,0.55)", backgroundColor: "rgba(220,252,231,0.78)" },
                      isWrongPlace && { borderColor: "rgba(245,158,11,0.55)", backgroundColor: "rgba(255,251,235,0.78)" },
                      isTarget && { borderColor: accentInk, borderStyle: "dashed", backgroundColor: `${accent}26` },
                      pressed && i > 0 && { opacity: 0.84 },
                    ]}
                  >
                    <View style={[styles.rungBadge, isSolved && styles.rungBadgeSolved]}>
                      {isSolved ? (
                        <Ionicons name="checkmark" size={12} color="#0a4f1f" />
                      ) : (
                        <Text style={styles.rungBadgeText}>{i + 1}</Text>
                      )}
                    </View>
                    <Text style={styles.rungClue} numberOfLines={2}>
                      {rung.clue}
                    </Text>
                    <View
                      style={[
                        styles.rungAnswerBox,
                        isSolved && { borderColor: "rgba(34,197,94,0.55)", backgroundColor: "rgba(187,247,208,0.85)" },
                        isWrongPlace && { borderColor: "rgba(245,158,11,0.55)", backgroundColor: "rgba(253,230,138,0.8)" },
                        isTarget && { borderColor: accentInk, borderStyle: "dashed", backgroundColor: `${accent}33` },
                      ]}
                    >
                      <Text
                        style={[styles.rungAnswerText, isSolved && { color: "#0a4f1f" }]}
                        numberOfLines={1}
                      >
                        {placed ? placed.toUpperCase() : "· · · ·"}
                      </Text>
                    </View>
                  </Pressable>
                </View>
              );
            })}
          </View>

          <View style={styles.wordBankContainer}>
            <View style={styles.wordBankHeader}>
              <Text style={styles.wordBankLabel}>Word Bank</Text>
              <Text style={styles.wordBankCount}>
                {wordsInBank.length} left
              </Text>
            </View>
            <View style={styles.wordBankChips}>
              {bankOrder.map((word) => {
                if (placements.includes(word)) return null;
                return (
                  <WordChip
                    key={word}
                    word={word}
                    isSelected={selectedWord === word}
                    isDragging={draggingWord === word}
                    accent={accent}
                    accentInk={accentInk}
                    onTap={() => handleWordTap(word)}
                    onDragStart={(_, pageX, pageY) => handleDragStart(word, pageX, pageY)}
                    onDragMove={handleDragMove}
                    onDragEnd={handleDragEnd}
                  />
                );
              })}
              {wordsInBank.length === 0 && !allSolved && (
                <Text style={styles.wordBankEmpty}>Tap a wrong rung to pick a word back up.</Text>
              )}
              {wordsInBank.length === 0 && allSolved && (
                <Text style={styles.wordBankEmpty}>All rungs solved — climb the next ladder!</Text>
              )}
            </View>
          </View>
        </ScrollView>
      </InAppGameShell>

      {draggingWord !== null && (
        <Animated.View
          style={[
            styles.dragGhost,
            {
              left: dragX,
              top: dragY,
              backgroundColor: accent,
              borderColor: accentInk,
            },
            isCompact && { paddingHorizontal: 12 },
          ]}
          pointerEvents="none"
        >
          <Text style={styles.dragGhostText}>{draggingWord.toUpperCase()}</Text>
        </Animated.View>
      )}
    </>
  );
}

const WordLadderGame = createGameRoute<WordLadderModeId>({
  gameId: "word-ladder",
  modeOptions: MODE_OPTIONS,
  GameplayScreen: WordLadderGameplay,
});

export default WordLadderGame;

const styles = StyleSheet.create({
  gameplayScroll: {
    paddingBottom: 4,
  },
  ladderContainer: {
    gap: 6,
  },
  rungRowWrapper: {},
  rungRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 54,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.10)",
    backgroundColor: "rgba(255,255,255,0.78)",
  },
  rungBadge: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.10)",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    flexShrink: 0,
  },
  rungBadgeSolved: {
    backgroundColor: "rgba(134,239,172,0.9)",
    borderColor: "rgba(34,197,94,0.7)",
  },
  rungBadgeText: {
    ...typography.bold,
    fontSize: 11,
    color: V2.ink,
    lineHeight: 13,
  },
  rungClue: {
    ...typography.semibold,
    flex: 1,
    fontSize: 12,
    color: V2.ink,
    lineHeight: 16,
    marginRight: 10,
  },
  rungAnswerBox: {
    minWidth: 86,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.20)",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  rungAnswerText: {
    ...typography.bold,
    fontSize: 13,
    color: V2.ink,
    letterSpacing: 1.2,
  },
  wordBankContainer: {
    marginTop: 14,
    paddingTop: 12,
    paddingBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: V2.hairline,
    backgroundColor: "rgba(255,255,255,0.74)",
  },
  wordBankHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  wordBankLabel: {
    ...typography.bold,
    fontSize: 10,
    letterSpacing: 0.6,
    color: V2.muted,
    textTransform: "uppercase",
  },
  wordBankCount: {
    ...typography.semibold,
    fontSize: 11,
    color: V2.muted,
    fontVariant: ["tabular-nums"],
  },
  wordBankChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  wordBankEmpty: {
    ...typography.semibold,
    flex: 1,
    fontSize: 12,
    color: V2.muted,
    fontStyle: "italic",
  },
  wordChip: {
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  wordChipDragging: {
    opacity: 0.3,
  },
  wordChipText: {
    ...typography.bold,
    fontSize: 14,
    color: V2.ink,
    letterSpacing: 1.2,
  },
  dragGhost: {
    position: "absolute",
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 9999,
  },
  dragGhostText: {
    ...typography.bold,
    fontSize: 14,
    color: "#FFFFFF",
    letterSpacing: 1.2,
  },
});
