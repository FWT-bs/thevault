import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GLASS } from "../constants/glassPalette";
import { typography } from "../constants/typography";

const LOADING_SPINNER_ANIMATION = require("../assets/Loading spinner simplui.json");
const CHECKMARK_ANIMATION = require("../assets/checkmark.json");

const AD_INTERVAL_MS = 90_000;
const AD_SECONDS = 5;
const MAX_LADDER_SIZE = 8;
const LEVEL_TARGET = 1000;

type Phase = "loading" | "landing" | "playing";

interface Rung {
  clue: string;
  answer: string;
}

const WORD_POOL = [
  "BAND","BANE","BARN","BARK","BORN","BOND","BEND","BENT","BEST","BEST","BUST","BUSY","BONY","BODY",
  "COLD","CORD","CARD","CARE","CANE","CONE","COIN","JOIN","JOIN","JOIN","JOLT","BOLT","BOLD","GOLD",
  "GOLF","GULF","GULL","FULL","FALL","BALL","BELL","BILL","SILL","SALT","MALT","MELT","MEND","SEND",
  "SEED","SEEN","SEEK","PEEK","PEAK","PEAR","DEAR","DEER","BEER","BEAR","GEAR","YEAR","YEAR","YARN",
  "YARD","HARD","CARD","WARD","WORD","WORK","PORK","PARK","DARK","LARK","LARD","LORD","LOAD","LEAD",
  "HEAD","HEAL","SEAL","TEAL","TELL","TALL","TAIL","MAIL","MAIN","PAIN","GAIN","RAIN","RAIN","RAIL",
  "SAIL","SOIL","COIL","FOIL","FAIL","FALL","WALL","WELL","WELD","WILD","MILD","MILE","PILE","PINE",
  "FINE","FIND","MIND","MINT","MEND","TEND","TENT","TEST","TEXT","NEXT","NEWT","NEWS","SEWS","SEAS",
  "SEAT","MEAT","MEET","FEET","FELT","BELT","BELT","BENT","LENT","LEND","LAND","SAND","HAND","HAND",
  "HIND","HINT","HUNT","HURT","CURT","CART","CORK","FORK","FORM","WORM","WARM","SWAM","SLAM","SLAB",
  "SCAB","SCAR","STAR","STIR","STAIR".slice(0,4), "STAY","CLAY","PLAY","PRAY","GRAY","GRAB","CRAB","CRIB",
  "DRIB".slice(0,4), "DRIP","DROP","CROP","CROW","BROW","BLOW","GLOW","SLOW","SNOW","SHOW","SHOT","SPOT",
  "SPIN","SKIN","SKIM","SLIM","SLID","SAID","PAID","MAID","MAIL","NAIL","SAIL","SOAR","BOAR","ROAR","ROAD",
  "TOAD","LOAD","GOAD","GOLD","COLD","COLT","BOLT","BOWL","HOWL","FOUL","SOUL","SOUR","FOUR","TOUR","YOUR",
  "YOUR".slice(0,4), "SURE","CURE","CORE","CORK","FORK","FORM","FIRM","FIRE","HIRE","HARD","HARE","HATE",
  "LATE","FATE","DATE","DATA","DADA".slice(0,4), "DART","PART","PORT","SORT","SORE","SIRE","SILO","SILO".slice(0,4),
].filter((w, i, a) => w.length === 4 && a.indexOf(w) === i);

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

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
  return ["COIN", "JOIN", "BOIN".replace("B","C"), "CORN", "CORK", "WORK", "WORD", "WARD"];
}

function rungCountForLevel(level: number) {
  if (level <= 1) return 4;
  if (level === 2) return 6;
  return 8;
}

function generateRungsForLevel(level: number): Rung[] {
  const rungCount = rungCountForLevel(level);
  const words = generateLevelWords(level);
  return words.slice(0, rungCount).map((answer, i) => {
    if (i === 0) {
      return {
        clue: level === 1 ? "Starting word for the tutorial" : buildHint(answer),
        answer,
      };
    }
    return {
      clue: buildHint(answer),
      answer,
    };
  });
}

function buildInitialPlacements(rungs: Rung[], level: number) {
  const next: (string | null)[] = Array(rungs.length).fill(null);
  if (level === 1 && rungs.length > 0) next[0] = rungs[0].answer;
  return next;
}

const WORD_HINTS: Record<string, string> = {
  BAND: "a music group",
  BANE: "a major cause of trouble",
  BARN: "a farm building",
  BARK: "the outside of a tree",
  BORN: "brought into life",
  BOND: "a close connection",
  BEND: "to curve",
  BENT: "not straight",
  BEST: "better than all others",
  BUST: "to break or catch",
  BUSY: "having a lot to do",
  BONY: "thin, with visible bones",
  BODY: "your physical form",
  COLD: "not warm",
  CORD: "a thick string",
  CARD: "a small flat paper",
  CARE: "to look after",
  CANE: "a walking stick",
  CONE: "a pointed shape",
  COIN: "a piece of money",
  JOIN: "to connect together",
  JOLT: "a sudden shock",
  BOLT: "to run suddenly or a metal fastener",
  BOLD: "confident and brave",
  GOLD: "a valuable yellow metal",
  GOLF: "a club-and-ball sport",
  GULF: "a large sea inlet",
  GULL: "a seabird",
  FULL: "holding as much as possible",
  FALL: "to drop down",
  BALL: "a round object",
  BELL: "a ringing object",
  BILL: "a statement for payment",
  SILL: "the bottom edge of a window",
  SALT: "a common seasoning",
  MALT: "germinated grain",
  MELT: "to become liquid",
  MEND: "to repair",
  SEND: "to dispatch",
  SEED: "a plant starter",
  SEEN: "noticed with eyes",
  SEEK: "to look for",
  PEEK: "to look quickly",
  PEAK: "the top point",
  PEAR: "a sweet fruit",
  DEAR: "beloved or valued",
  DEER: "a hoofed forest animal",
  BEER: "an alcoholic drink",
  BEAR: "a large mammal",
  GEAR: "equipment",
  YEAR: "twelve months",
  YARN: "thread for knitting",
  YARD: "an outdoor area",
  HARD: "not soft",
  WARD: "a hospital section",
  WORD: "a unit of language",
  WORK: "activity done to achieve something",
  PORK: "meat from a pig",
  PARK: "a public green space",
  DARK: "with little light",
  LARK: "a songbird",
  LARD: "rendered pork fat",
  LORD: "a titled man",
  LOAD: "a heavy amount carried",
  LEAD: "to guide",
  HEAD: "top part of the body",
  HEAL: "to recover",
  SEAL: "to close tightly or a marine animal",
  TEAL: "a blue-green color",
  TELL: "to say",
  TALL: "high in height",
  TAIL: "rear appendage",
  MAIL: "post",
  MAIN: "most important",
  PAIN: "physical suffering",
  GAIN: "to obtain",
  RAIN: "water falling from clouds",
  RAIL: "a long metal bar for trains",
  SAIL: "boat cloth moved by wind",
  SOIL: "earth",
  COIL: "a series of loops",
  FOIL: "thin metal sheet",
  FAIL: "to not succeed",
  WALL: "a vertical structure",
  WELL: "a deep water shaft",
  WELD: "to fuse metal",
  WILD: "untamed",
  MILD: "not strong",
  MILE: "a unit of distance",
  PILE: "a heap",
  PINE: "an evergreen tree",
  FINE: "of high quality",
  FIND: "to discover",
  MIND: "the thinking part of a person",
  MINT: "an herb",
  TEND: "to care for",
  TENT: "a portable shelter",
  TEST: "an exam",
  TEXT: "written words",
  NEXT: "coming after",
  NEWT: "a small amphibian",
  NEWS: "current reports",
  SEWS: "stitches cloth",
  SEAS: "large bodies of salt water",
  SEAT: "a place to sit",
  MEAT: "animal flesh used as food",
  MEET: "to come together",
  FEET: "plural of foot",
  FELT: "a fabric made by pressing fibers",
  BELT: "a waist strap",
  LENT: "a period in the christian calendar",
  LEND: "to give temporarily",
  LAND: "ground",
  SAND: "tiny grains at beaches",
  HAND: "the end of your arm",
  HIND: "rear part",
  HINT: "a small clue",
  HUNT: "to search for game",
  HURT: "to cause pain",
  CURT: "rudely brief",
  CART: "a wheeled carrier",
  CORK: "bottle stopper material",
  FORK: "an eating utensil",
  FORM: "shape",
  WORM: "a small crawling invertebrate",
  WARM: "slightly hot",
  SWAM: "past tense of swim",
  SLAM: "to shut forcefully",
  SLAB: "a thick flat piece",
  SCAB: "a crust over a healing wound",
  SCAR: "a healed skin mark",
  STAR: "a bright object in space",
  STIR: "to mix",
  STAY: "to remain",
  CLAY: "a moldable earth material",
  PLAY: "to have fun",
  PRAY: "to speak to a deity",
  GRAY: "a neutral color",
  GRAB: "to seize quickly",
  CRAB: "a sea creature with claws",
  CRIB: "a baby bed",
  DRIP: "to fall in drops",
  DROP: "to let fall",
  CROP: "farm produce",
  CROW: "a black bird",
  BROW: "area above the eye",
  BLOW: "to move air",
  GLOW: "steady light",
  SLOW: "not fast",
  SNOW: "frozen precipitation",
  SHOW: "to display",
  SHOT: "one attempt",
  SPOT: "a small mark",
  SPIN: "to rotate",
  SKIN: "outer body layer",
  SKIM: "to move lightly over a surface",
  SLIM: "thin",
  SLID: "past tense of slide",
  SAID: "past tense of say",
  PAID: "gave money for something",
  MAID: "a domestic worker",
  NAIL: "a finger tip plate or metal fastener",
  SOAR: "to fly high",
  BOAR: "a wild pig",
  ROAR: "a loud deep sound",
  ROAD: "a route for travel",
  TOAD: "a bumpy-skinned amphibian",
  GOAD: "to provoke",
  COLT: "a young male horse",
  BOWL: "a round dish",
  HOWL: "a long loud cry",
  FOUL: "offensive or dirty",
  SOUL: "the spiritual self",
  SOUR: "acidic taste",
  FOUR: "the number after three",
  TOUR: "a trip through places",
  YOUR: "belonging to you",
  SURE: "certain",
  CURE: "to heal",
  CORE: "the central part",
  FIRM: "solid and stable",
  FIRE: "flames and heat",
  HIRE: "to employ",
  HARE: "a rabbit-like animal",
  HATE: "to strongly dislike",
  LATE: "not on time",
  FATE: "destiny",
  DATE: "day on a calendar",
  DATA: "facts and information",
  DART: "a small pointed missile",
  PART: "a piece of something",
  PORT: "a harbor",
  SORT: "to arrange",
  SORE: "painful",
  SIRE: "a male parent animal",
  SILO: "a tall farm storage tower",
};

function buildHint(answer: string): string {
  const clue = WORD_HINTS[answer];
  if (clue) {
    return clue.charAt(0).toUpperCase() + clue.slice(1);
  }
  return "Common four-letter word";
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const QUESTS = [
  { id: "q1", title: "Solve 3 rungs", progress: "1 / 3" },
  { id: "q2", title: "Finish without mistakes", progress: "Active" },
  { id: "q3", title: "Complete full ladder", progress: "0 / 1" },
];

const STREAK_DAYS = [
  { day: "Mon", state: "done" as const, reward: "+10" },
  { day: "Tue", state: "done" as const, reward: "+15" },
  { day: "Wed", state: "today" as const, reward: "+25" },
  { day: "Thu", state: "locked" as const, reward: "+40" },
  { day: "Fri", state: "locked" as const, reward: "+60" },
];

const LEADERBOARD = [
  { rank: 1, name: "NovaLex", score: "4,980" },
  { rank: 2, name: "RuneFlow", score: "4,720" },
  { rank: 3, name: "CipherJay", score: "4,350" },
  { rank: 4, name: "You", score: "3,980" },
];

// ─── Word Chip ─────────────────────────────────────────────────────────────────

interface WordChipProps {
  word: string;
  isSelected: boolean;
  isDragging: boolean;
  onTap: (word: string) => void;
  onDragStart: (word: string, pageX: number, pageY: number) => void;
  onDragMove: (pageX: number, pageY: number) => void;
  onDragEnd: (pageX: number, pageY: number) => void;
}

function WordChip({ word, isSelected, isDragging, onTap, onDragStart, onDragMove, onDragEnd }: WordChipProps) {
  // Store all mutable props in a ref so PanResponder (created once) always calls latest callbacks
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
        if (Math.abs(gs.dx) > 4 || Math.abs(gs.dy) > 4) {
          hasDraggedRef.current = true;
        }
        p.current.onDragMove(e.nativeEvent.pageX, e.nativeEvent.pageY);
      },
      onPanResponderRelease: (e, gs) => {
        if (!hasDraggedRef.current && Math.abs(gs.dx) < 4 && Math.abs(gs.dy) < 4) {
          p.current.onDragEnd(-1, -1); // cancel drag
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
      style={[styles.wordChip, isSelected && styles.wordChipSelected, isDragging && styles.wordChipDragging]}
    >
      <Text style={[styles.wordChipText, isSelected && styles.wordChipTextSelected]}>{word}</Text>
    </View>
  );
}

// ─── Screen ────────────────────────────────────────────────────────────────────

export default function WordLadderScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isCompact = width < 390;
  const loadingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const adLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [phase, setPhase] = useState<Phase>("loading");
  const [showSettings, setShowSettings] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // ── Playing state ──────────────────────────────────────────────────────────
  const [currentLevel, setCurrentLevel] = useState(1);
  const [currentRungCount, setCurrentRungCount] = useState(() => rungCountForLevel(1));
  const [currentRungs, setCurrentRungs] = useState<Rung[]>(() => generateRungsForLevel(1));
  const [placements, setPlacements] = useState<(string | null)[]>(() =>
    buildInitialPlacements(generateRungsForLevel(1), 1),
  );
  const placementsRef = useRef(placements);
  useEffect(() => {
    placementsRef.current = placements;
  }, [placements]);

  const bankWords = useMemo(() => shuffle(currentRungs.map((r) => r.answer)), [currentRungs]);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);

  // Drag state
  const dragX = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const [draggingWord, setDraggingWord] = useState<string | null>(null);
  const draggingWordRef = useRef<string | null>(null);

  const rungDropRefs = useRef<(View | null)[]>(new Array(rungCountForLevel(1)).fill(null));
  const rungDropLayouts = useRef<({ x: number; y: number; width: number; height: number } | null)[]>(
    new Array(rungCountForLevel(1)).fill(null),
  );

  // ── Ad state ───────────────────────────────────────────────────────────────
  const [adVisible, setAdVisible] = useState(false);
  const [adSecondsLeft, setAdSecondsLeft] = useState(AD_SECONDS);
  const [hasSeenFirstAd, setHasSeenFirstAd] = useState(false);
  const [showLevelClear, setShowLevelClear] = useState(false);

  // ── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    loadingRef.current = setTimeout(() => setPhase("landing"), 1200);
    return () => {
      if (loadingRef.current) clearTimeout(loadingRef.current);
    };
  }, []);

  useEffect(() => {
    if (phase !== "playing") return;
    adLoopRef.current = setInterval(() => {
      setAdVisible(true);
      setAdSecondsLeft(AD_SECONDS);
    }, AD_INTERVAL_MS);
    return () => {
      if (adLoopRef.current) clearInterval(adLoopRef.current);
      adLoopRef.current = null;
    };
  }, [phase]);

  useEffect(() => {
    if (!adVisible) return;
    if (!hasSeenFirstAd) setHasSeenFirstAd(true);
    const ticker = setInterval(() => {
      setAdSecondsLeft((v) => Math.max(0, v - 1));
    }, 1000);
    const done = setTimeout(() => setAdVisible(false), AD_SECONDS * 1000);
    return () => {
      clearInterval(ticker);
      clearTimeout(done);
    };
  }, [adVisible, hasSeenFirstAd]);

  // Win condition
  const allSolved = useMemo(() => placements.every((p, i) => p === currentRungs[i].answer), [placements, currentRungs]);

  useEffect(() => {
    if (allSolved && phase === "playing") {
      setTimeout(() => setShowLevelClear(true), 300);
    }
  }, [allSolved, phase]);

  // ── Callbacks ──────────────────────────────────────────────────────────────

  const handleStartGame = useCallback(() => {
    setPhase("playing");
  }, []);

  const returnToLanding = useCallback(() => {
    setCurrentLevel(1);
    setCurrentRungCount(rungCountForLevel(1));
    const nextRungs = generateRungsForLevel(1);
    setCurrentRungs(nextRungs);
    setPlacements(buildInitialPlacements(nextRungs, 1));
    setSelectedWord(null);
    setDraggingWord(null);
    draggingWordRef.current = null;
    setShowLevelClear(false);
    setHasSeenFirstAd(false);
    setPhase("landing");
  }, []);

  const measureDropTargets = useCallback(() => {
    rungDropRefs.current.forEach((ref, i) => {
      ref?.measureInWindow((x, y, w, h) => {
        rungDropLayouts.current[i] = { x, y, width: w, height: h };
      });
    });
  }, []);

  const placeWord = useCallback((word: string, rungIndex: number) => {
    setPlacements((prev) => {
      const next = [...prev];
      const prevRung = next.indexOf(word);
      if (prevRung >= 0) next[prevRung] = null;
      next[rungIndex] = word;
      return next;
    });
    setSelectedWord(null);
  }, []);

  const handleRungTap = useCallback(
    (i: number) => {
      if (i === 0) return;
      const currentlyPlaced = placementsRef.current[i];
      if (selectedWord) {
        placeWord(selectedWord, i);
      } else if (currentlyPlaced) {
        // Pick word back up to bank
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
      dragX.setValue(pageX - 36);
      dragY.setValue(pageY - 18);
      measureDropTargets();
    },
    [dragX, dragY, measureDropTargets],
  );

  const handleDragMove = useCallback(
    (pageX: number, pageY: number) => {
      dragX.setValue(pageX - 36);
      dragY.setValue(pageY - 18);
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
        return pageX >= layout.x && pageX <= layout.x + layout.width && pageY >= layout.y && pageY <= layout.y + layout.height;
      });
      if (targetIndex > 0) {
        placeWord(word, targetIndex);
      }
    },
    [placeWord],
  );

  const startLevel = useCallback((level: number) => {
    const rungCount = rungCountForLevel(level);
    setCurrentLevel(level);
    setCurrentRungCount(rungCount);
    const nextRungs = generateRungsForLevel(level);
    setCurrentRungs(nextRungs);
    setPlacements(buildInitialPlacements(nextRungs, level));
    setSelectedWord(null);
    setDraggingWord(null);
    draggingWordRef.current = null;
    rungDropRefs.current = new Array(rungCount).fill(null);
    rungDropLayouts.current = new Array(rungCount).fill(null);
  }, []);

  const handleNextLevel = useCallback(() => {
    const nextLevel = Math.min(currentLevel + 1, LEVEL_TARGET);
    startLevel(nextLevel);
    setShowLevelClear(false);
  }, [currentLevel, startLevel]);

  // ── Loading ────────────────────────────────────────────────────────────────

  if (phase === "loading") {
    return (
      <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
        <GameBackdrop />
        <View style={styles.loadingFill}>
          <LottieView source={LOADING_SPINNER_ANIMATION} autoPlay loop style={styles.loadingAnim} />
          <Text style={styles.loadingTitle}>Loading Word Ladder</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Landing ────────────────────────────────────────────────────────────────

  if (phase === "landing") {
    return (
      <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
        <GameBackdrop />
        <ScrollView
          style={styles.landingScroll}
          contentContainerStyle={styles.landingScrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Band 1 — Resource header */}
          <View style={styles.bandHeader}>
            <View style={styles.resourceShelf}>
              <View style={styles.resourcePill}>
                <Ionicons name="heart" size={14} color={GLASS.oxblood} />
                <Text style={styles.resourceValue}>5</Text>
                <Text style={styles.resourceSub}>04:52</Text>
                <Pressable style={styles.resourcePlus} hitSlop={8}>
                  <Ionicons name="add" size={12} color="#000000" />
                </Pressable>
              </View>
              <View style={styles.resourcePill}>
                <MaterialCommunityIcons name="lightning-bolt" size={14} color={GLASS.mustardDeep} />
                <Text style={styles.resourceValue}>1,240</Text>
                <Text style={styles.resourceSub}>XP</Text>
              </View>
            </View>

            <View style={styles.utilityRow}>
              <Pressable onPress={() => router.back()} style={styles.iconBtn} hitSlop={8}>
                <Ionicons name="chevron-back" size={20} color="#000000" />
              </Pressable>
              <Pressable onPress={() => setShowSettings(true)} style={styles.iconBtn} hitSlop={8}>
                <Ionicons name="settings-outline" size={18} color="#000000" />
              </Pressable>
            </View>
          </View>

          {/* Band 2 — Hero */}
          <View style={styles.bandHero}>
            <WordLadderLogo />
            <Text style={styles.landingTitle}>Word Ladder</Text>
            <Text style={styles.landingSub}>Climb the ladder, level by level.</Text>
            <View style={styles.levelTag}>
              <Text style={styles.levelTagText}>Level 1</Text>
            </View>
          </View>

          {/* Band 3 — Quests + streak */}
          <View style={styles.bandContent}>
            <View style={styles.contentCard}>
              <View style={styles.contentHeader}>
                <Text style={styles.eyebrow}>Daily Tasks</Text>
                <Text style={styles.eyebrowMeta}>3</Text>
              </View>
              <View style={styles.questList}>
                {QUESTS.map((quest) => (
                  <View key={quest.id} style={styles.questRow}>
                    <View style={styles.questDot} />
                    <Text style={styles.questTitle} numberOfLines={1}>
                      {quest.title}
                    </Text>
                    <Text style={styles.questProgress}>{quest.progress}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.contentCard}>
              <View style={styles.contentHeader}>
                <Text style={styles.eyebrow}>Streak</Text>
                <Text style={styles.eyebrowMeta}>3d</Text>
              </View>
              <View style={styles.streakGrid}>
                {STREAK_DAYS.map((day) => (
                  <View key={day.day} style={styles.streakCol}>
                    <View
                      style={[
                        styles.streakNode,
                        day.state === "done" && styles.streakNodeDone,
                        day.state === "today" && styles.streakNodeToday,
                      ]}
                    >
                      {day.state === "done" ? (
                        <Ionicons name="checkmark" size={12} color="#000000" />
                      ) : (
                        <Text style={styles.streakReward}>{day.reward}</Text>
                      )}
                    </View>
                    <Text style={styles.streakDay}>{day.day}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Band 4 — Action */}
          <View style={styles.bandAction}>
            <Pressable
              onPress={() => {
                startLevel(1);
                handleStartGame();
              }}
              style={({ pressed }) => [styles.playBtn, pressed && styles.btnPressed]}
            >
              <View pointerEvents="none" style={styles.playBtnContent}>
                <Ionicons name="play" size={isCompact ? 22 : 24} color="#000000" />
                <Text style={styles.playBtnText}>Play</Text>
              </View>
            </Pressable>
            <Pressable
              onPress={() => setShowLeaderboard(true)}
              style={({ pressed }) => [styles.secondaryBtn, pressed && styles.btnPressed]}
            >
              <View pointerEvents="none" style={styles.secondaryBtnContent}>
                <Ionicons name="podium-outline" size={16} color="#000000" />
                <Text style={styles.secondaryBtnText}>Rank</Text>
              </View>
            </Pressable>
          </View>

          {/* Band 5 — Footer shelf */}
          <View style={styles.bandFooter}>
            <Pressable style={({ pressed }) => [styles.shelfBtn, pressed && styles.btnPressed]}>
              <View pointerEvents="none" style={styles.shelfBtnContent}>
                <Ionicons name="gift-outline" size={18} color="#000000" />
                <Text style={styles.shelfBtnText}>Daily Gift</Text>
              </View>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.shelfBtn, pressed && styles.btnPressed]}>
              <View pointerEvents="none" style={styles.shelfBtnContent}>
                <Ionicons name="information-circle-outline" size={18} color="#000000" />
                <Text style={styles.shelfBtnText}>How to Play</Text>
              </View>
            </Pressable>
          </View>
        </ScrollView>

        <Modal visible={showLeaderboard} transparent animationType="fade" statusBarTranslucent>
          <View style={styles.modalScrim}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Leaderboard</Text>
              {LEADERBOARD.map((entry) => (
                <View key={entry.rank} style={styles.leadRow}>
                  <Text style={styles.leadRank}>#{entry.rank}</Text>
                  <Text style={styles.leadName}>{entry.name}</Text>
                  <Text style={styles.leadScore}>{entry.score}</Text>
                </View>
              ))}
              <Pressable style={styles.modalCloseBtn} onPress={() => setShowLeaderboard(false)}>
                <View pointerEvents="none" style={styles.modalCloseContent}>
                  <Text style={styles.modalCloseText}>Close</Text>
                </View>
              </Pressable>
            </View>
          </View>
        </Modal>

        <Modal visible={showSettings} transparent animationType="fade" statusBarTranslucent>
          <View style={styles.modalScrim}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Settings</Text>
              <Text style={styles.rowItemSub}>Sound: On</Text>
              <Text style={styles.rowItemSub}>Vibration: On</Text>
              <Text style={styles.rowItemSub}>Hints: On</Text>
              <Pressable style={styles.modalCloseBtn} onPress={() => setShowSettings(false)}>
                <View pointerEvents="none" style={styles.modalCloseContent}>
                  <Text style={styles.modalCloseText}>Close</Text>
                </View>
              </Pressable>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // ── Playing ────────────────────────────────────────────────────────────────

  const wordsInBank = bankWords.filter((w) => !placements.includes(w));
  const hasSelection = selectedWord !== null;

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <GameBackdrop />

      {/* Top bar */}
      <View style={styles.gameTopRow}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} hitSlop={8}>
          <Ionicons name="chevron-back" size={20} color="#000000" />
        </Pressable>
        <View style={styles.gameHudCenter}>
          <View style={styles.levelPill}>
            <Text style={styles.levelPillText}>Level {currentLevel}</Text>
          </View>
        </View>
        {hasSeenFirstAd ? (
          <View style={styles.creditsPill}>
            <MaterialCommunityIcons name="lightning-bolt" size={12} color={GLASS.mustardDeep} />
            <Text style={styles.creditsText}>+120</Text>
          </View>
        ) : (
          <View style={styles.iconBtnSpacer} />
        )}
      </View>

      {/* Ladder — all 8 rungs visible at once */}
      <View style={styles.ladderContainer}>
        {currentRungs.map((rung, i) => {
          const placed = placements[i];
          const isSolved = placed === rung.answer;
          const isWrongPlace = placed !== null && !isSolved;
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
                style={({ pressed }) => [
                  styles.rungRow,
                  isSolved && styles.rungRowSolved,
                  isWrongPlace && styles.rungRowWrong,
                  hasSelection && !placed && styles.rungRowTarget,
                  pressed && styles.btnPressed,
                ]}
              >
                <View style={[styles.rungBadge, isSolved && styles.rungBadgeSolved]}>
                  {isSolved ? (
                    <Ionicons name="checkmark" size={11} color="#000000" />
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
                    isSolved && styles.rungAnswerBoxSolved,
                    isWrongPlace && styles.rungAnswerBoxWrong,
                    hasSelection && !placed && styles.rungAnswerBoxTarget,
                  ]}
                >
                  <Text style={[styles.rungAnswerText, isSolved && styles.rungAnswerTextSolved]}>
                    {placed ? placed.toLowerCase() : "· · · ·"}
                  </Text>
                </View>
              </Pressable>
            </View>
          );
        })}
      </View>

      {/* Word bank */}
      <View style={styles.wordBankContainer}>
        <View style={styles.wordBankHeader}>
          <Text style={styles.wordBankLabel}>Word Bank</Text>
          {hasSelection && (
            <Pressable onPress={() => setSelectedWord(null)} hitSlop={8}>
              <Text style={styles.wordBankDeselect}>Cancel</Text>
            </Pressable>
          )}
          <Text style={styles.wordBankCount}>
            {wordsInBank.length}/{currentRungCount} left
          </Text>
        </View>
        <View style={styles.wordBankChips}>
          {bankWords.map((word) => {
            if (placements.includes(word)) return null;
            return (
              <WordChip
                key={word}
                word={word.toLowerCase()}
                isSelected={selectedWord === word}
                isDragging={draggingWord === word}
                onTap={() => handleWordTap(word)}
                onDragStart={(_, pageX, pageY) => handleDragStart(word, pageX, pageY)}
                onDragMove={handleDragMove}
                onDragEnd={handleDragEnd}
              />
            );
          })}
          {wordsInBank.length === 0 && (
            <Text style={styles.wordBankEmpty}>All words placed!</Text>
          )}
        </View>
      </View>

      {/* Floating drag ghost — follows finger */}
      {draggingWord !== null && (
        <Animated.View
          style={[styles.dragGhost, { left: dragX, top: dragY }]}
          pointerEvents="none"
        >
          <Text style={styles.dragGhostText}>{draggingWord.toLowerCase()}</Text>
        </Animated.View>
      )}

      {/* Ad modal */}
      <Modal visible={adVisible} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.modalScrim}>
          <View style={styles.adCard}>
            <Text style={styles.adTitle}>Ad Break</Text>
            <Text style={styles.adSub}>Resuming in {adSecondsLeft}s</Text>
          </View>
        </View>
      </Modal>

      {/* Level clear modal */}
      <Modal visible={showLevelClear} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.modalScrim}>
          <View style={styles.modalCard}>
            <LottieView source={CHECKMARK_ANIMATION} autoPlay loop={false} style={styles.checkAnim} />
            <Text style={styles.modalTitle}>Ladder Complete!</Text>
            <Text style={styles.rowItemSub}>Level {currentLevel} solved.</Text>
            <Pressable style={styles.modalCloseBtn} onPress={handleNextLevel}>
              <View pointerEvents="none" style={styles.modalCloseContent}>
                <Text style={styles.modalCloseText}>Next Level</Text>
              </View>
            </Pressable>
            <Pressable style={styles.modalAltBtn} onPress={returnToLanding}>
              <View pointerEvents="none" style={styles.modalCloseContent}>
                <Text style={styles.modalCloseText}>Back to Home</Text>
              </View>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function GameBackdrop() {
  return (
    <View
      style={[StyleSheet.absoluteFillObject, { backgroundColor: "#FFFFFF" }]}
      pointerEvents="none"
    />
  );
}

function WordLadderLogo() {
  return (
    <View style={styles.logoStage}>
      <View style={styles.logoBurst} />
      <View style={styles.logoPlate}>
        <View style={styles.logoRail} />
        <View style={[styles.logoRail, styles.logoRailRight]} />
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[styles.logoRung, { top: 10 + i * 11 }]} />
        ))}
      </View>
      <View style={styles.logoTile}>
        <Text style={styles.logoTileText}>w</Text>
      </View>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const GUTTER = 20;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  // ── Loading ────────────────────────────────────────────────────────────────
  loadingFill: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: GUTTER,
  },
  loadingAnim: { width: 110, height: 110 },
  loadingTitle: {
    ...typography.bold,
    marginTop: 10,
    fontSize: 24,
    color: GLASS.ink,
    letterSpacing: -0.6,
  },

  // ── Landing ────────────────────────────────────────────────────────────────
  landingScroll: { flex: 1 },
  landingScrollContent: {
    flexGrow: 1,
    paddingHorizontal: GUTTER,
    paddingTop: 8,
    paddingBottom: 12,
  },
  bandHeader: { gap: 12 },
  resourceShelf: { flexDirection: "row" },
  resourcePill: {
    flex: 1,
    height: 44,
    marginHorizontal: 5,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  resourceValue: {
    ...typography.bold,
    marginLeft: 8,
    marginRight: 6,
    fontSize: 14,
    color: "#000000",
    letterSpacing: -0.2,
  },
  resourceSub: {
    ...typography.semibold,
    fontSize: 10,
    color: GLASS.inkMuted,
    letterSpacing: 0.4,
  },
  resourcePlus: {
    marginLeft: "auto",
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: GLASS.cobalt,
    alignItems: "center",
    justifyContent: "center",
  },
  utilityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  bandHero: {
    flex: 1,
    minHeight: 230,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  logoStage: { width: 116, height: 116, alignItems: "center", justifyContent: "center" },
  logoBurst: {
    position: "absolute",
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: "rgba(125,211,252,0.34)",
  },
  logoPlate: {
    width: 74,
    height: 74,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  logoRail: {
    position: "absolute",
    top: 8,
    bottom: 8,
    left: 14,
    width: 3,
    backgroundColor: "#000000",
    borderRadius: 2,
  },
  logoRailRight: { left: undefined, right: 14 },
  logoRung: {
    position: "absolute",
    left: 14,
    right: 14,
    height: 4,
    backgroundColor: GLASS.cobaltDeep,
    borderRadius: 2,
  },
  logoTile: {
    position: "absolute",
    right: 8,
    bottom: 10,
    width: 28,
    height: 28,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: GLASS.copper,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "-6deg" }],
  },
  logoTileText: {
    ...typography.bold,
    fontSize: 15,
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  landingTitle: {
    ...typography.bold,
    marginTop: 18,
    fontSize: 34,
    lineHeight: 38,
    color: GLASS.ink,
    letterSpacing: -1,
    textAlign: "center",
    alignSelf: "stretch",
  },
  landingSub: {
    ...typography.semibold,
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    color: GLASS.inkMuted,
    textAlign: "center",
    alignSelf: "stretch",
  },
  levelTag: {
    marginTop: 14,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "#FFFFFF",
  },
  levelTagText: {
    ...typography.bold,
    fontSize: 10,
    letterSpacing: 0.2,
    color: "#000000",
  },
  bandContent: {
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 14,
    gap: 10,
  },
  contentCard: {
    width: "44%",
    maxWidth: 180,
    minHeight: 156,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.84)",
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  contentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  eyebrow: {
    ...typography.bold,
    fontSize: 11,
    color: GLASS.ink,
    letterSpacing: 0.2,
  },
  eyebrowMeta: {
    ...typography.semibold,
    fontSize: 10,
    color: GLASS.inkMuted,
    letterSpacing: 0.2,
  },
  questList: { gap: 10 },
  questRow: { flexDirection: "row", alignItems: "center" },
  questDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: GLASS.cobalt,
    marginRight: 10,
  },
  questTitle: {
    ...typography.semibold,
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    color: GLASS.ink,
    marginRight: 8,
  },
  questProgress: {
    ...typography.bold,
    fontSize: 10,
    color: GLASS.inkMuted,
    letterSpacing: 0.4,
  },
  streakGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  streakCol: { alignItems: "center" },
  streakNode: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  streakNodeDone: { backgroundColor: GLASS.cobaltLight },
  streakNodeToday: { backgroundColor: GLASS.copper },
  streakReward: {
    ...typography.bold,
    fontSize: 8,
    color: "#000000",
    letterSpacing: 0.2,
  },
  streakDay: {
    ...typography.semibold,
    fontSize: 9,
    color: GLASS.inkMuted,
    letterSpacing: 0.4,
  },
  bandAction: { flexDirection: "row", marginTop: 6 },
  playBtn: {
    flex: 2,
    height: 64,
    marginRight: 5,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: GLASS.cobalt,
  },
  playBtnContent: {
    width: "100%",
    height: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  playBtnText: {
    ...typography.bold,
    marginLeft: 10,
    fontSize: 22,
    color: "#000000",
  },
  secondaryBtn: {
    flex: 1,
    height: 64,
    marginLeft: 5,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "#FFFFFF",
  },
  secondaryBtnContent: {
    width: "100%",
    height: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: {
    ...typography.bold,
    marginLeft: 6,
    fontSize: 14,
    color: "#000000",
  },
  btnPressed: { opacity: 0.92, transform: [{ scale: 0.98 }] },
  bandFooter: { flexDirection: "row", marginTop: 12 },
  shelfBtn: {
    flex: 1,
    height: 54,
    marginHorizontal: 5,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "#FFFFFF",
  },
  shelfBtnContent: {
    width: "100%",
    height: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  shelfBtnText: {
    ...typography.bold,
    marginLeft: 8,
    fontSize: 12,
    color: "#000000",
    letterSpacing: 0.2,
  },
  rowItemSub: {
    ...typography.semibold,
    fontSize: 11,
    color: GLASS.inkMuted,
  },

  // ── Playing — top bar ──────────────────────────────────────────────────────
  gameTopRow: {
    height: 52,
    paddingHorizontal: GUTTER,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  gameHudCenter: {
    flex: 1,
    alignItems: "center",
  },
  levelPill: {
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "#FFFFFF",
  },
  levelPillText: {
    ...typography.bold,
    fontSize: 10,
    letterSpacing: 0.2,
    color: "#000000",
  },
  creditsPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "#FFFFFF",
    gap: 4,
  },
  creditsText: {
    ...typography.bold,
    fontSize: 11,
    color: "#000000",
    letterSpacing: -0.1,
  },
  iconBtnSpacer: { width: 40, height: 40 },

  // ── Playing — ladder ───────────────────────────────────────────────────────
  ladderContainer: {
    flex: 1,
    paddingHorizontal: GUTTER,
    paddingVertical: 4,
    justifyContent: "center",
  },
  rungRowWrapper: {
    marginBottom: 3,
  },
  rungRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 54,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "rgba(255,255,255,0.72)",
  },
  rungRowSolved: {
    borderColor: "rgba(34,197,94,0.6)",
    backgroundColor: "rgba(220,252,231,0.72)",
  },
  rungRowWrong: {
    borderColor: "rgba(245,158,11,0.5)",
    backgroundColor: "rgba(255,251,235,0.72)",
  },
  rungRowTarget: {
    borderColor: GLASS.cobaltDeep,
    borderStyle: "dashed",
    backgroundColor: "rgba(186,230,253,0.28)",
  },
  rungBadge: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    flexShrink: 0,
  },
  rungBadgeSolved: {
    backgroundColor: "rgba(134,239,172,0.9)",
    borderColor: "rgba(34,197,94,0.8)",
  },
  rungBadgeText: {
    ...typography.bold,
    fontSize: 10,
    color: "#000000",
    lineHeight: 12,
  },
  rungClue: {
    ...typography.semibold,
    flex: 1,
    fontSize: 12,
    color: GLASS.ink,
    letterSpacing: -0.1,
    marginRight: 10,
  },
  rungAnswerBox: {
    minWidth: 72,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.2)",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  rungAnswerBoxSolved: {
    backgroundColor: "rgba(134,239,172,0.7)",
    borderColor: "rgba(34,197,94,0.6)",
  },
  rungAnswerBoxWrong: {
    backgroundColor: "rgba(253,230,138,0.7)",
    borderColor: "rgba(245,158,11,0.5)",
  },
  rungAnswerBoxTarget: {
    borderColor: GLASS.cobaltDeep,
    borderStyle: "dashed",
    backgroundColor: "rgba(186,230,253,0.4)",
  },
  rungAnswerText: {
    ...typography.bold,
    fontSize: 12,
    color: "#000000",
    letterSpacing: 0.8,
  },
  rungAnswerTextSolved: {
    color: "#166534",
  },

  // ── Playing — word bank ────────────────────────────────────────────────────
  wordBankContainer: {
    paddingHorizontal: GUTTER,
    paddingTop: 8,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.08)",
    backgroundColor: "rgba(255,255,255,0.6)",
    minHeight: 120,
  },
  wordBankHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  wordBankLabel: {
    ...typography.bold,
    fontSize: 10,
    letterSpacing: 0.2,
    color: GLASS.inkMuted,
    flex: 1,
  },
  wordBankDeselect: {
    ...typography.semibold,
    fontSize: 11,
    color: GLASS.cobaltDeep,
    marginRight: 10,
  },
  wordBankCount: {
    ...typography.semibold,
    fontSize: 10,
    color: GLASS.inkMuted,
    letterSpacing: 0.4,
  },
  wordBankChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  wordBankEmpty: {
    ...typography.semibold,
    fontSize: 12,
    color: GLASS.inkMuted,
    fontStyle: "italic",
  },

  // Word chip
  wordChip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  wordChipSelected: {
    backgroundColor: GLASS.cobalt,
    borderColor: GLASS.cobaltDeep,
  },
  wordChipDragging: {
    opacity: 0.3,
  },
  wordChipText: {
    ...typography.bold,
    fontSize: 13,
    color: "#000000",
    letterSpacing: 0.8,
  },
  wordChipTextSelected: {
    color: "#000000",
  },

  // Drag ghost
  dragGhost: {
    position: "absolute",
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GLASS.cobaltDeep,
    backgroundColor: GLASS.cobalt,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 9999,
  },
  dragGhostText: {
    ...typography.bold,
    fontSize: 13,
    color: "#000000",
    letterSpacing: 0.8,
  },

  // ── Modals ─────────────────────────────────────────────────────────────────
  modalScrim: {
    flex: 1,
    backgroundColor: "rgba(18,20,24,0.56)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: GUTTER,
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "#FFFFFF",
    padding: 16,
    gap: 10,
  },
  modalTitle: {
    ...typography.bold,
    fontSize: 20,
    color: GLASS.ink,
    letterSpacing: -0.5,
  },
  modalCloseBtn: {
    marginTop: 6,
    height: 48,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: GLASS.cobalt,
  },
  modalAltBtn: {
    height: 44,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "#FFFFFF",
  },
  modalCloseContent: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCloseText: {
    ...typography.bold,
    fontSize: 14,
    color: "#000000",
  },
  leadRow: { flexDirection: "row", alignItems: "center" },
  leadRank: {
    ...typography.bold,
    width: 28,
    fontSize: 12,
    color: GLASS.inkMuted,
  },
  leadName: {
    ...typography.semibold,
    flex: 1,
    marginHorizontal: 8,
    fontSize: 13,
    color: GLASS.ink,
  },
  leadScore: {
    ...typography.bold,
    fontSize: 13,
    color: GLASS.steelDeep,
  },
  adCard: {
    width: "100%",
    maxWidth: 320,
    minHeight: 220,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: "#1A1A1F",
  },
  adTitle: {
    ...typography.bold,
    fontSize: 26,
    color: "#FDFBF6",
    letterSpacing: -0.7,
  },
  adSub: {
    ...typography.semibold,
    marginTop: 6,
    fontSize: 13,
    color: "rgba(253,251,246,0.74)",
  },
  checkAnim: { width: 84, height: 84, alignSelf: "center" },
});
