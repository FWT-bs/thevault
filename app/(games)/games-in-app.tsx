import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { formatSharePercent } from "@thevault/domain";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { HeaderBackButton } from "@react-navigation/elements";
import { MotiView } from "moti";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import TabScreen from "../../components/TabScreen";
import { GlassSurface } from "../../components/GlassSurface";
import { GLASS, GLASS_SURFACE } from "../../constants/glassPalette";
import { typography } from "../../constants/typography";
import { useCatalog } from "../../services/features/catalog";
import { useCompleteGameSession, useStartGameSession } from "../../services/features/gameplay";
import { useVaultLevel } from "../../services/features/vaultLevel";

const AD_AFTER_LAUNCHES = 5;
const AD_DURATION_SECONDS = 5;
const HORIZONTAL_PADDING = 24;
const GRID_COLS = 4;
const GRID_GAP = 8;

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];
type CardVariant = "portrait" | "scene" | "match" | "icon";
type CardBadge = "NEW" | "POPULAR" | "LIVE";
type FilterId = "all" | "live" | "solo" | "multi" | "new";

interface GridGame {
  id: string;
  title: string;
  variant: CardVariant;
  icon: IconName;
  bg: string;
  accent?: string;
  isDark?: boolean;
  players: string;
  badge?: CardBadge;
  multi?: boolean;
  fresh?: boolean;
  live?: boolean;
  // Used by "scene" variant — additional supporting icons that sit
  // around the main motif to imply a denser game world.
  sceneIcons?: IconName[];
  // Used by "match" variant — count of avatar dots to render.
  matchSeats?: number;
}

const GRID_GAMES: GridGame[] = [
  {
    id: "starborn-tactician",
    title: "Starborn Tactician",
    variant: "portrait",
    icon: "shield-account",
    bg: "#1A1A1F",
    isDark: true,
    players: "1-8",
    badge: "POPULAR",
    multi: true,
  },
  {
    id: "mystic-match",
    title: "Mystic Match",
    variant: "icon",
    icon: "puzzle-star",
    bg: "#DED1FB",
    players: "2-4",
    multi: true,
  },
  {
    id: "arena-brawl",
    title: "Arena Brawl",
    variant: "scene",
    icon: "sword-cross",
    bg: "#FFD7C2",
    sceneIcons: ["shield-half-full", "fire", "trophy-variant-outline"],
    players: "Unlimited",
    badge: "POPULAR",
    multi: true,
  },
  {
    id: "number-quest",
    title: "Number Quest",
    variant: "icon",
    icon: "numeric",
    bg: "#F6D98A",
    players: "1 player",
  },
  {
    id: "cipher-spire",
    title: "Cipher Spire",
    variant: "portrait",
    icon: "incognito",
    bg: "#1C1E22",
    isDark: true,
    players: "1-4",
    multi: true,
  },
  {
    id: "coral-crash",
    title: "Coral Crash",
    variant: "scene",
    icon: "fish",
    bg: "#A9E5FF",
    sceneIcons: ["wave", "snail", "anchor"],
    players: "2-6",
    multi: true,
  },
  {
    id: "emoji-royale",
    title: "Emoji Royale",
    variant: "match",
    icon: "emoticon-cool-outline",
    bg: "#CDEFD8",
    players: "Unlimited",
    badge: "NEW",
    fresh: true,
    multi: true,
    matchSeats: 5,
  },
  {
    id: "forge-fold",
    title: "Forge & Fold",
    variant: "icon",
    icon: "hammer",
    bg: "#FFB347",
    players: "1 player",
  },
  {
    id: "glide-greens",
    title: "Glide Greens",
    variant: "scene",
    icon: "golf",
    bg: "#9FE2B5",
    sceneIcons: ["pine-tree", "weather-sunny", "flag-checkered"],
    players: "1-2",
    multi: true,
  },
  {
    id: "hex-heist",
    title: "Hex Heist",
    variant: "portrait",
    icon: "ninja",
    bg: "#1A1A1F",
    isDark: true,
    players: "2-4",
    badge: "NEW",
    fresh: true,
    multi: true,
  },
  {
    id: "iron-pilots",
    title: "Iron Pilots",
    variant: "match",
    icon: "rocket",
    bg: "#BAE6FD",
    players: "4-8",
    multi: true,
    matchSeats: 4,
  },
  {
    id: "jelly-joust",
    title: "Jelly Joust",
    variant: "icon",
    icon: "candycane",
    bg: "#F4A4A4",
    players: "2-4",
    multi: true,
  },
  {
    id: "knights-drift",
    title: "Knight's Drift",
    variant: "scene",
    icon: "horse-variant",
    bg: "#DED1FB",
    sceneIcons: ["castle", "sword", "crown-outline"],
    players: "1-6",
    multi: true,
  },
  {
    id: "lumen-league",
    title: "Lumen League",
    variant: "match",
    icon: "lightning-bolt",
    bg: "#E8C547",
    players: "Unlimited",
    badge: "LIVE",
    live: true,
    multi: true,
    matchSeats: 6,
  },
  {
    id: "mosaic",
    title: "Mosaic",
    variant: "icon",
    icon: "shape-outline",
    bg: "#A9E5FF",
    players: "1 player",
  },
  {
    id: "nebula-drop",
    title: "Nebula Drop",
    variant: "portrait",
    icon: "robot-happy",
    bg: "#1C1E22",
    isDark: true,
    players: "1-4",
    multi: true,
  },
  {
    id: "orbit-sprint",
    title: "Orbit Sprint",
    variant: "scene",
    icon: "earth",
    bg: "#FFD7C2",
    sceneIcons: ["satellite-variant", "star-four-points", "moon-waning-crescent"],
    players: "1-8",
    badge: "NEW",
    fresh: true,
    multi: true,
  },
  {
    id: "puzzle-pop",
    title: "Puzzle Pop",
    variant: "icon",
    icon: "puzzle-outline",
    bg: "#9FE2B5",
    players: "1 player",
  },
  {
    id: "quantum-quiz",
    title: "Quantum Quiz",
    variant: "match",
    icon: "head-question-outline",
    bg: "#FDFBF6",
    players: "2-12",
    multi: true,
    matchSeats: 4,
  },
  {
    id: "reels-revolt",
    title: "Reels Revolt",
    variant: "scene",
    icon: "slot-machine-outline",
    bg: "#F4A4A4",
    sceneIcons: ["star-outline", "diamond-stone", "fruit-cherries"],
    players: "1-4",
    multi: true,
  },
  {
    id: "saga-sweep",
    title: "Saga Sweep",
    variant: "portrait",
    icon: "account-cowboy-hat",
    bg: "#1A1A1F",
    isDark: true,
    players: "1-2",
    multi: true,
  },
  {
    id: "tile-titans",
    title: "Tile Titans",
    variant: "icon",
    icon: "view-grid-plus-outline",
    bg: "#7DD3FC",
    players: "1-2",
    badge: "NEW",
    fresh: true,
    multi: true,
  },
  {
    id: "vault-velocity",
    title: "Vault Velocity",
    variant: "scene",
    icon: "safe",
    bg: "#FFB347",
    sceneIcons: ["lock-outline", "key-variant", "timer-outline"],
    players: "Unlimited",
    badge: "POPULAR",
    multi: true,
  },
  {
    id: "word-weaver",
    title: "Word Weaver",
    variant: "icon",
    icon: "alphabetical-variant",
    bg: "#F7FCFF",
    players: "1 player",
  },
  {
    id: "word-ladder",
    title: "Word Ladder",
    variant: "icon",
    icon: "ladder",
    bg: "#BAE6FD",
    players: "1 player",
    badge: "NEW",
    fresh: true,
  },
  {
    id: "block-blast",
    title: "Block Blast",
    variant: "icon",
    icon: "view-grid-plus-outline",
    bg: "#00E5FF",
    players: "1 player",
    badge: "NEW",
    fresh: true,
  },
  {
    id: "bricks-vs-balls",
    title: "Bricks vs Balls",
    variant: "scene",
    icon: "target",
    bg: "#FF4D8D",
    sceneIcons: ["circle-double", "wall", "star-four-points"],
    players: "1 player",
    badge: "LIVE",
    live: true,
  },
  {
    id: "color-stack",
    title: "Color Stack",
    variant: "icon",
    icon: "layers-triple-outline",
    bg: "#8BFF5A",
    players: "1 player",
    badge: "NEW",
    fresh: true,
  },
  {
    id: "jigsaw-puzzle",
    title: "Jigsaw Puzzle",
    variant: "scene",
    icon: "puzzle-outline",
    bg: "#BAE6FD",
    players: "1 player",
    badge: "NEW",
    fresh: true,
    sceneIcons: ["image-outline", "cursor-move", "star-four-points"],
  },
  {
    id: "blackjack",
    title: "Blackjack",
    variant: "scene",
    icon: "cards-playing-outline",
    bg: "#0B1729",
    isDark: true,
    players: "1 player",
    badge: "NEW",
    fresh: true,
    sceneIcons: ["cash", "diamond-stone", "trophy-variant-outline"],
  },
  {
    id: "high-low",
    title: "High Low",
    variant: "icon",
    icon: "arrow-up-down-bold-outline",
    bg: "#BAE6FD",
    players: "1 player",
    badge: "NEW",
    fresh: true,
  },
  {
    id: "single-line",
    title: "Single Line",
    variant: "icon",
    icon: "vector-polyline",
    bg: "#EDE9FE",
    players: "1 player",
    badge: "NEW",
    fresh: true,
  },
  {
    id: "water-sorter",
    title: "Water Sorter",
    variant: "icon",
    icon: "test-tube",
    bg: "#CCFBF1",
    players: "1 player",
    badge: "NEW",
    fresh: true,
  },
  {
    id: "plinko",
    title: "Plinko",
    variant: "icon",
    icon: "hockey-puck",
    bg: "#FFEDD5",
    players: "1 player",
    badge: "NEW",
    fresh: true,
  },
  {
    id: "coloring",
    title: "Coloring",
    variant: "icon",
    icon: "palette",
    bg: "#FCE7F3",
    players: "1 player",
    badge: "NEW",
    fresh: true,
  },
  {
    id: "fruit-merge",
    title: "Fruit Merge",
    variant: "icon",
    icon: "fruit-watermelon",
    bg: "#FBCFE8",
    players: "1 player",
    badge: "NEW",
    fresh: true,
  },
];

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "live", label: "Live" },
  { id: "solo", label: "Solo" },
  { id: "multi", label: "Multiplayer" },
  { id: "new", label: "New" },
];

export default function InAppGamesPage() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { data: catalogItems } = useCatalog();
  const { data: vaultLevel } = useVaultLevel();
  const startSession = useStartGameSession();
  const completeSession = useCompleteGameSession();

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterId>("all");
  const launchCountRef = useRef(0);
  const [sessionCredits, setSessionCredits] = useState(24);
  const [adVisible, setAdVisible] = useState(false);
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const shareLabel = formatSharePercent(vaultLevel?.revenueShareBps ?? 3000);

  const cardWidth = useMemo(
    () =>
      Math.floor(
        (width - HORIZONTAL_PADDING * 2 - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS,
      ),
    [width],
  );

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    return GRID_GAMES.filter((game) => {
      if (trimmed && !game.title.toLowerCase().includes(trimmed)) return false;
      if (filter === "all") return true;
      if (filter === "live") return game.live;
      if (filter === "solo") return !game.multi;
      if (filter === "multi") return !!game.multi;
      if (filter === "new") return game.fresh;
      return true;
    });
  }, [query, filter]);

  // Clear the highlighted card when the user returns to this screen
  // (otherwise it stays orange-bordered forever after a launch).
  useFocusEffect(
    useCallback(() => {
      return () => setActiveGameId(null);
    }, []),
  );

  const handleLaunch = useCallback(
    async (game: GridGame) => {
      if (adVisible) return;
      setActiveGameId(game.id);
      launchCountRef.current += 1;
      if (launchCountRef.current % AD_AFTER_LAUNCHES === 0) {
        setAdVisible(true);
      }
      setSessionCredits((current) => current + 3);

      if (game.id === "word-ladder") {
        router.push("/word-ladder");
      }
      if (game.id === "blackjack") {
        router.push("/blackjack");
      }
      if (game.id === "block-blast") {
        router.push("/block-blast");
      }
      if (game.id === "bricks-vs-balls") {
        router.push("/bricks-vs-balls");
      }
      if (game.id === "color-stack") {
        router.push("/color-stack");
      }
      if (game.id === "jigsaw-puzzle") {
        router.push("/jigsaw-puzzle");
      }
      if (game.id === "high-low") {
        router.push("/high-low");
      }
      if (game.id === "single-line") {
        router.push("/single-line");
      }
      if (game.id === "water-sorter") {
        router.push("/water-sorter");
      }
      if (game.id === "plinko") {
        router.push("/plinko");
      }
      if (game.id === "coloring") {
        router.push("/coloring");
      }
      if (game.id === "fruit-merge") {
        router.push("/fruit-merge");
      }
      try {
        const started = await startSession.mutateAsync({ gameId: game.id, modeId: "classic" });
        await completeSession.mutateAsync({ sessionId: started.session.id, score: Math.floor(Math.random() * 800) + 100 });
      } catch {
        // gameplay API is scaffolded; keep launch responsive if unavailable
      }
    },
    [adVisible, router, startSession, completeSession],
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "In App Games",
          headerBackTitle: "Earn",
          headerTintColor: "#000000",
          headerShadowVisible: false,
          headerLeft: (props) => (
            <HeaderBackButton
              {...props}
              label="Earn"
              onPress={() => {
                if (router.canGoBack()) router.back();
                else router.replace("/games-tab");
              }}
            />
          ),
        }}
      />
      <TabScreen
        title=""
        background={<GameBackdrop />}
        backgroundColor="#FFFFFF"
        titleColor={GLASS.ink}
        subtitleColor={GLASS.inkMuted}
      >
      <MotiView
        from={{ opacity: 0, translateY: 8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 360 }}
        style={styles.eyebrowBlock}
      >
        <Text style={styles.eyebrowKicker}>Library</Text>
        <Text style={styles.eyebrowTitle}>IN APP GAMES</Text>
        <Text style={styles.eyebrowSub}>
          {filtered.length} of {catalogItems?.filter((c) => c.category === "in-app").length ?? GRID_GAMES.length} games · {shareLabel} ad-share boosts
        </Text>
      </MotiView>

      <View style={styles.adShareStrip}>
        <Ionicons name="shield-checkmark-outline" size={16} color={GLASS.steelDeep} />
        <Text style={styles.adShareStripText}>
          Complete games to unlock rewarded ads. Estimated rewards stay pending until verified.
        </Text>
      </View>

      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 420, delay: 80 }}
      >
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder={`Search ${GRID_GAMES.length} in-app games`}
        />
      </MotiView>

      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 420, delay: 140 }}
      >
        <FilterRow active={filter} onChange={setFilter} />
      </MotiView>

      <View style={styles.gridSectionHeader}>
        <Text style={styles.gridSectionLabel}>Browse the vault</Text>
        <Text style={styles.gridSectionHint}>{filtered.length} games</Text>
      </View>

      <View style={styles.grid}>
        {filtered.map((game, index) => (
          <GameCard
            key={game.id}
            game={game}
            width={cardWidth}
            index={index}
            isActive={activeGameId === game.id}
            onPress={() => handleLaunch(game)}
          />
        ))}
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="gamepad-variant-outline"
              size={26}
              color={GLASS.inkMuted}
            />
            <Text style={styles.emptyTitle}>No games match</Text>
            <Text style={styles.emptySub}>Try clearing the search or pick another filter.</Text>
          </View>
        ) : null}
      </View>

        <DummyAdOverlay
          visible={adVisible}
          credits={sessionCredits}
          onComplete={() => setAdVisible(false)}
        />
      </TabScreen>
    </>
  );
}

// ---------------------------------------------------------------------------
// Search + filters

function SearchBar({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <GlassSurface
      tone="light"
      radius={22}
      intensity={38}
      style={styles.searchOutline}
      contentStyle={styles.searchContent}
    >
      <Ionicons name="search" size={18} color={GLASS.steelDeep} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? "Search games"}
        placeholderTextColor={GLASS.inkFaint}
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.searchInput}
      />
      {value.length > 0 ? (
        <Pressable
          onPress={() => onChangeText("")}
          hitSlop={10}
          style={({ pressed }) => pressed && { opacity: 0.6 }}
        >
          <Ionicons name="close-circle" size={18} color={GLASS.inkMuted} />
        </Pressable>
      ) : null}
    </GlassSurface>
  );
}

function FilterRow({
  active,
  onChange,
}: {
  active: FilterId;
  onChange: (id: FilterId) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterContent}
      style={styles.filterScroll}
    >
      {FILTERS.map((item) => {
        const isActive = item.id === active;
        return (
          <Pressable
            key={item.id}
            onPress={() => onChange(item.id)}
            style={({ pressed }) => [
              styles.filterChip,
              isActive && styles.filterChipActive,
              pressed && { opacity: 0.85 },
            ]}
          >
            <View pointerEvents="none" style={styles.filterChipContent}>
              <Text
                style={[
                  styles.filterChipText,
                  isActive && styles.filterChipTextActive,
                ]}
              >
                {item.label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Cards

function GameCard({
  game,
  width,
  index,
  isActive,
  onPress,
}: {
  game: GridGame;
  width: number;
  index: number;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 320, delay: 60 + index * 18 }}
      style={{ width }}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          pressed && { transform: [{ scale: 0.97 }] },
          isActive && styles.cardActive,
        ]}
      >
        <View pointerEvents="none" style={styles.cardInner}>
          <View
            style={[
              styles.thumb,
              { width: width - 16, backgroundColor: game.bg },
              game.isDark && styles.thumbDark,
            ]}
          >
            {game.variant === "portrait" ? (
              <PortraitThumb game={game} />
            ) : game.variant === "scene" ? (
              <SceneThumb game={game} />
            ) : game.variant === "match" ? (
              <MatchThumb game={game} />
            ) : (
              <IconThumb game={game} />
            )}

            {game.badge ? <BadgePill kind={game.badge} /> : null}
          </View>

          <Text style={styles.cardTitle} numberOfLines={1}>
            {game.title}
          </Text>
        </View>
      </Pressable>
    </MotiView>
  );
}

function PortraitThumb({ game }: { game: GridGame }) {
  return (
    <>
      <View
        style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(56,189,248,0.32)" }]}
        pointerEvents="none"
      />
      <View style={styles.portraitGlow} />
      <MaterialCommunityIcons name={game.icon} size={42} color="#FDFBF6" />
      <View style={styles.portraitPlinth}>
        <Ionicons name="star" size={7} color="#F6D98A" />
        <Text style={styles.portraitPlinthText}>HERO</Text>
      </View>
    </>
  );
}

function SceneThumb({ game }: { game: GridGame }) {
  const supporting = game.sceneIcons ?? [];
  return (
    <>
      <View style={styles.sceneTopRow}>
        {supporting[0] ? (
          <View style={[styles.sceneChip, styles.sceneChipLeft]}>
            <MaterialCommunityIcons
              name={supporting[0]}
              size={11}
              color={GLASS.ink}
            />
          </View>
        ) : null}
        {supporting[1] ? (
          <View style={[styles.sceneChip, styles.sceneChipRight]}>
            <MaterialCommunityIcons
              name={supporting[1]}
              size={11}
              color={GLASS.ink}
            />
          </View>
        ) : null}
      </View>
      <MaterialCommunityIcons
        name={game.icon}
        size={32}
        color={GLASS.ink}
      />
      {supporting[2] ? (
        <View style={styles.sceneFooterChip}>
          <MaterialCommunityIcons
            name={supporting[2]}
            size={10}
            color={GLASS.ink}
          />
        </View>
      ) : null}
    </>
  );
}

function MatchThumb({ game }: { game: GridGame }) {
  const seats = game.matchSeats ?? 4;
  return (
    <>
      <View style={styles.matchHeader}>
        <View style={styles.matchPulse} />
        <Text style={styles.matchHeaderText}>MATCH</Text>
      </View>
      <MaterialCommunityIcons
        name={game.icon}
        size={26}
        color={GLASS.ink}
      />
      <View style={styles.matchSeatRow}>
        {Array.from({ length: seats }).map((_, idx) => (
          <View
            key={idx}
            style={[
              styles.matchSeat,
              idx === seats - 1 && styles.matchSeatOpen,
            ]}
          />
        ))}
      </View>
    </>
  );
}

function IconThumb({ game }: { game: GridGame }) {
  return (
    <>
      <View style={styles.iconHighlight} />
      <View style={styles.iconShadow} />
      <MaterialCommunityIcons
        name={game.icon}
        size={36}
        color={GLASS.ink}
      />
    </>
  );
}

function BadgePill({ kind }: { kind: CardBadge }) {
  const palette =
    kind === "POPULAR"
      ? { bg: "#FF7A00", text: "#FFFFFF", icon: "flame" as const }
      : kind === "LIVE"
        ? { bg: "#7A1E2C", text: "#FFFFFF", icon: "ellipse" as const }
        : { bg: "#F6D98A", text: "#000000", icon: "sparkles" as const };
  return (
    <View style={[styles.badgePill, { backgroundColor: palette.bg }]}>
      <Ionicons name={palette.icon} size={7} color={palette.text} />
      <Text style={[styles.badgePillText, { color: palette.text }]}>
        {kind}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Ad overlay (preserved from prior screen)

function DummyAdOverlay({
  visible,
  credits,
  onComplete,
}: {
  visible: boolean;
  credits: number;
  onComplete: () => void;
}) {
  const [secondsLeft, setSecondsLeft] = useState(AD_DURATION_SECONDS);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!visible) return;
    setSecondsLeft(AD_DURATION_SECONDS);
    const interval = setInterval(
      () => setSecondsLeft((current) => Math.max(0, current - 1)),
      1000,
    );
    return () => clearInterval(interval);
  }, [visible]);

  // Fire onComplete in a separate effect so we never trigger a setState in
  // another component while this one is rendering (the updater of setSecondsLeft).
  useEffect(() => {
    if (!visible || secondsLeft > 0) return;
    const t = setTimeout(() => onCompleteRef.current?.(), 200);
    return () => clearTimeout(t);
  }, [visible, secondsLeft]);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.adScrim}>
        <MotiView
          from={{ opacity: 0, scale: 0.94, translateY: 12 }}
          animate={{ opacity: 1, scale: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 220 }}
          style={styles.adCard}
        >
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "#1A1A1F" }]} pointerEvents="none" />
          <View style={styles.adBadge}>
            <Ionicons name="play-circle" size={14} color="#000000" />
            <Text style={styles.adBadgeText}>Dummy ad playing</Text>
          </View>
          <View style={styles.adScreen}>
            <MaterialCommunityIcons name="movie-open-play-outline" size={42} color="#FDFBF6" />
            <Text style={styles.adTitle}>Short break</Text>
            <Text style={styles.adSub}>
              Your +{credits} CR session keeps running after this sample ad.
            </Text>
          </View>
          <Text style={styles.adCountdown}>{secondsLeft}s</Text>
        </MotiView>
      </View>
    </Modal>
  );
}

function GameBackdrop() {
  return <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "#FFFFFF" }]} pointerEvents="none" />;
}

const styles = StyleSheet.create({
  eyebrowBlock: {
    alignItems: "center",
    marginTop: -30,
    marginBottom: 2,
  },
  eyebrowKicker: {
    ...typography.bold,
    fontSize: 9,
    letterSpacing: 2,
    color: GLASS.inkMuted,
    textTransform: "uppercase",
  },
  eyebrowTitle: {
    ...typography.bold,
    marginTop: 0,
    fontSize: 28,
    letterSpacing: 1.2,
    color: GLASS.ink,
    textAlign: "center",
  },
  eyebrowSub: {
    ...typography.semibold,
    marginTop: 0,
    fontSize: 11,
    color: GLASS.inkMuted,
    letterSpacing: -0.1,
    textAlign: "center",
  },
  adShareStrip: {
    marginTop: 10,
    marginBottom: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "rgba(255,255,255,0.82)",
    paddingHorizontal: 13,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  adShareStripText: {
    ...typography.semibold,
    flex: 1,
    fontSize: 11,
    lineHeight: 15,
    color: GLASS.inkMuted,
  },

  searchOutline: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    borderRadius: 22,
  },
  searchContent: {
    height: 52,
    paddingVertical: 0,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchInput: {
    ...typography.semibold,
    flex: 1,
    paddingVertical: 0,
    fontSize: 15,
    color: "#000000",
    letterSpacing: -0.15,
  },

  filterScroll: {
    marginHorizontal: -HORIZONTAL_PADDING,
    marginTop: 12,
  },
  filterContent: {
    paddingHorizontal: HORIZONTAL_PADDING,
    gap: 8,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "rgba(255,255,255,0.72)",
  },
  filterChipActive: {
    backgroundColor: "#000000",
  },
  filterChipContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  filterChipText: {
    ...typography.bold,
    fontSize: 11,
    letterSpacing: 0.2,
    color: "#000000",
  },
  filterChipTextActive: {
    color: "#FDFBF6",
  },

  gridSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 22,
    marginBottom: 10,
  },
  gridSectionLabel: {
    ...typography.bold,
    fontSize: 12,
    color: "#000000",
  },
  gridSectionHint: {
    ...typography.semibold,
    fontSize: 11,
    color: GLASS.inkMuted,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GRID_GAP,
  },

  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "#FFFFFF",
    padding: 7,
    shadowColor: GLASS.charcoal,
    shadowOpacity: 0.14,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardActive: {
    borderColor: "#FF7A00",
    shadowOpacity: 0.22,
  },
  cardInner: {
    width: "100%",
  },
  thumb: {
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
  },
  thumbDark: {
    borderColor: "rgba(253,251,246,0.18)",
  },
  cardTitle: {
    ...typography.bold,
    marginTop: 6,
    fontSize: 11,
    letterSpacing: -0.2,
    color: "#000000",
  },
  badgePill: {
    position: "absolute",
    top: 5,
    left: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
  },
  badgePillText: {
    ...typography.bold,
    fontSize: 7,
    letterSpacing: 0.6,
  },

  // Portrait thumbnail decoration
  portraitGlow: {
    position: "absolute",
    top: -16,
    right: -16,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(56,189,248,0.32)",
  },
  portraitPlinth: {
    position: "absolute",
    bottom: 5,
    left: 5,
    right: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: "rgba(253,251,246,0.16)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(253,251,246,0.3)",
  },
  portraitPlinthText: {
    ...typography.bold,
    fontSize: 7,
    letterSpacing: 1,
    color: "#FDFBF6",
  },

  // Scene thumbnail decoration
  sceneTopRow: {
    position: "absolute",
    top: 5,
    left: 5,
    right: 5,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sceneChip: {
    width: 18,
    height: 18,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(253,251,246,0.7)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: GLASS_SURFACE.edgeInk,
  },
  sceneChipLeft: {},
  sceneChipRight: {},
  sceneFooterChip: {
    position: "absolute",
    bottom: 5,
    right: 5,
    width: 18,
    height: 18,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(253,251,246,0.78)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: GLASS_SURFACE.edgeInk,
  },

  // Match thumbnail decoration
  matchHeader: {
    position: "absolute",
    top: 5,
    left: 5,
    right: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  matchPulse: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#7A1E2C",
  },
  matchHeaderText: {
    ...typography.bold,
    fontSize: 7,
    letterSpacing: 1,
    color: GLASS.ink,
  },
  matchSeatRow: {
    position: "absolute",
    bottom: 5,
    left: 5,
    right: 5,
    flexDirection: "row",
    justifyContent: "center",
    gap: 3,
  },
  matchSeat: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: GLASS.ink,
    borderWidth: 1,
    borderColor: "rgba(253,251,246,0.7)",
  },
  matchSeatOpen: {
    backgroundColor: "rgba(253,251,246,0.7)",
    borderColor: GLASS.ink,
  },

  // Icon thumbnail decoration
  iconHighlight: {
    position: "absolute",
    top: -10,
    left: -10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(253,251,246,0.55)",
  },
  iconShadow: {
    position: "absolute",
    bottom: -14,
    right: -14,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(26,26,31,0.12)",
  },

  emptyState: {
    width: "100%",
    paddingVertical: 28,
    alignItems: "center",
    gap: 6,
  },
  emptyTitle: {
    ...typography.bold,
    fontSize: 14,
    color: "#000000",
  },
  emptySub: {
    ...typography.semibold,
    fontSize: 11,
    color: GLASS.inkMuted,
    textAlign: "center",
    maxWidth: 240,
  },

  adScrim: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(18,20,24,0.66)",
  },
  adCard: {
    width: "100%",
    maxWidth: 340,
    minHeight: 330,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    overflow: "hidden",
    padding: 18,
    alignItems: "center",
    justifyContent: "space-between",
  },
  adBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "#F6D98A",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
  },
  adBadgeText: {
    ...typography.bold,
    fontSize: 10,
    color: "#000000",
    letterSpacing: 0.2,
  },
  adScreen: {
    alignItems: "center",
    paddingHorizontal: 16,
  },
  adTitle: {
    ...typography.bold,
    marginTop: 14,
    fontSize: 27,
    color: "#FDFBF6",
    letterSpacing: -0.8,
  },
  adSub: {
    ...typography.semibold,
    marginTop: 6,
    textAlign: "center",
    fontSize: 13,
    lineHeight: 19,
    color: "rgba(253,251,246,0.72)",
  },
  adCountdown: {
    ...typography.bold,
    fontSize: 18,
    color: "#A9E5FF",
  },
});
