import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { formatSharePercent } from "@thevault/domain";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { MotiView } from "moti";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ListRenderItemInfo,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { V2 } from "../constants/glassPalette";
import { markOnboarded } from "../constants/onboardingState";
import { typography } from "../constants/typography";
import { HeroGlassButton } from "./HeroGlassButton";
import { LiquidGlassChip } from "./LiquidGlassChip";

type SlideId = "game" | "ad" | "estimate" | "level" | "channels" | "wallet";
type GameId = "puzzle" | "trivia" | "blackjack";
type ChannelId = "in-app" | "partner" | "surveys";

const ACCENT = "#2F6BFF";
const ACCENT_SOFT = "#EAF1FF";
const INK_DARK = "#0E1217";
const SURFACE = "#FBFBFD";

const SLIDES: { id: SlideId; eyebrow: string; title: string; subtitle: string }[] = [
  {
    id: "game",
    eyebrow: "Step 1",
    title: "Choose your first game",
    subtitle:
      "Start with a quick round to unlock your first reward boost. Short rounds help you learn how earnings work.",
  },
  {
    id: "ad",
    eyebrow: "Step 2",
    title: "Watch a rewarded ad",
    subtitle:
      "After your round, you can watch one boosted ad. The Vault shows an estimated reward based on the ad value.",
  },
  {
    id: "estimate",
    eyebrow: "Step 3",
    title: "See your estimate",
    subtitle:
      "When the ad ends, your reward moves into pending while it is reviewed. You can see exactly how the estimate is calculated.",
  },
  {
    id: "level",
    eyebrow: "Step 4",
    title: "Increase your share",
    subtitle:
      "Your Vault Level raises the percentage you keep from verified rewards. Higher levels also unlock a larger daily cap.",
  },
  {
    id: "channels",
    eyebrow: "Step 5",
    title: "Earn in more ways",
    subtitle:
      "Besides in-app rounds, you can earn from partner offers and surveys. External rewards stay protected until providers verify completion.",
  },
  {
    id: "wallet",
    eyebrow: "Step 6",
    title: "Cash out confirmed rewards",
    subtitle:
      "Only verified funds are redeemable. Pending and locked balances stay separate until review is complete.",
  },
];

const GAMES = [
  {
    id: "puzzle" as const,
    label: "Puzzle Rush",
    meta: "Fast and easy",
    icon: "puzzle" as const,
  },
  {
    id: "trivia" as const,
    label: "Trivia Sprint",
    meta: "Answer for bonus",
    icon: "lightbulb-on-outline" as const,
  },
  {
    id: "blackjack" as const,
    label: "Blackjack",
    meta: "Classic quick play",
    icon: "cards-playing-outline" as const,
  },
];

const TIERS = [
  { id: "starter", label: "Starter", shareBps: 3000, cap: "$0.50 daily cap", progress: 0.18 },
  { id: "bronze", label: "Bronze", shareBps: 3500, cap: "$1 daily cap", progress: 0.36 },
  { id: "silver", label: "Silver", shareBps: 4000, cap: "$2.50 daily cap", progress: 0.54 },
  { id: "gold", label: "Gold", shareBps: 4500, cap: "$5 daily cap", progress: 0.78 },
  { id: "platinum", label: "Platinum", shareBps: 5000, cap: "$10 daily cap", progress: 1 },
];

const CHANNELS = [
  {
    id: "in-app" as const,
    title: "In-app games",
    detail: "Play quick rounds and unlock boosts",
    icon: "game-controller-outline" as const,
    tint: "#E6EEFF",
  },
  {
    id: "partner" as const,
    title: "Partner offers",
    detail: "Install apps and reach milestones",
    icon: "rocket-outline" as const,
    tint: "#FFE3D7",
  },
  {
    id: "surveys" as const,
    title: "Surveys",
    detail: "Answer questions for higher payouts",
    icon: "clipboard-outline" as const,
    tint: "#DDF1E2",
  },
];

export function OnboardingSlides() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const listRef = useRef<FlatList<(typeof SLIDES)[number]>>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedGame, setSelectedGame] = useState<GameId>("puzzle");
  const [adWatched, setAdWatched] = useState(false);
  const [roundPlayed, setRoundPlayed] = useState(false);
  const [selectedTier, setSelectedTier] = useState("starter");
  const [selectedChannel, setSelectedChannel] = useState<ChannelId>("in-app");

  const isLast = activeIndex === SLIDES.length - 1;
  const selectedTierData = TIERS.find((tier) => tier.id === selectedTier) ?? TIERS[0];
  const rewardPreview = useMemo(
    () => ((0.022 * selectedTierData.shareBps) / 10000).toFixed(4),
    [selectedTierData.shareBps],
  );

  const goToIndex = useCallback((idx: number) => {
    const clamped = Math.max(0, Math.min(SLIDES.length - 1, idx));
    listRef.current?.scrollToIndex({ index: clamped, animated: true });
    setActiveIndex(clamped);
  }, []);

  const handleFinish = useCallback(() => {
    markOnboarded();
    router.replace("/home-tab");
  }, [router]);

  const handlePrimary = useCallback(() => {
    if (isLast) handleFinish();
    else goToIndex(activeIndex + 1);
  }, [activeIndex, goToIndex, handleFinish, isLast]);

  const renderSlide = useCallback(
    ({ item }: ListRenderItemInfo<(typeof SLIDES)[number]>) => (
      <View style={{ width, flex: 1 }}>
        <SlideContent
          slide={item}
          selectedGame={selectedGame}
          onSelectGame={setSelectedGame}
          roundPlayed={roundPlayed}
          onPlayRound={() => setRoundPlayed(true)}
          adWatched={adWatched}
          onWatchAd={() => setAdWatched(true)}
          selectedTier={selectedTier}
          onSelectTier={setSelectedTier}
          rewardPreview={rewardPreview}
          selectedTierData={selectedTierData}
          selectedChannel={selectedChannel}
          onSelectChannel={setSelectedChannel}
        />
      </View>
    ),
    [
      adWatched,
      rewardPreview,
      roundPlayed,
      selectedChannel,
      selectedGame,
      selectedTier,
      selectedTierData,
      width,
    ],
  );

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right", "bottom"]}>
        <StatusBar style="dark" />

        <View style={styles.topRow}>
          <View style={styles.stepPill}>
            <Text style={styles.stepPillText}>
              {activeIndex + 1} / {SLIDES.length}
            </Text>
          </View>
          <LiquidGlassChip
            systemImage="xmark"
            fallbackIcon="close"
            accessibilityLabel="Skip onboarding"
            size={36}
            iconColor="#000000"
            onPress={handleFinish}
          />
        </View>

        <View style={styles.slidesContainer}>
          <FlatList
            ref={listRef}
            data={SLIDES}
            keyExtractor={(item) => item.id}
            renderItem={renderSlide}
            horizontal
            pagingEnabled
            scrollEnabled={false}
            showsHorizontalScrollIndicator={false}
            getItemLayout={(_, idx) => ({
              length: width,
              offset: width * idx,
              index: idx,
            })}
          />
        </View>

        <View style={styles.dotsRow}>
          {SLIDES.map((slide, idx) => {
            const isActive = idx === activeIndex;
            return (
              <Pressable
                key={slide.id}
                onPress={() => goToIndex(idx)}
                hitSlop={8}
                style={styles.dotHitArea}
              >
                <MotiView
                  animate={{
                    width: isActive ? 8 : 6,
                    height: isActive ? 8 : 6,
                    opacity: isActive ? 1 : 0.32,
                    backgroundColor: isActive ? ACCENT : "#000000",
                  }}
                  transition={{ type: "spring", damping: 18, stiffness: 220 }}
                  style={styles.dot}
                />
              </Pressable>
            );
          })}
        </View>

        <View style={styles.ctaWrap}>
          {isLast ? (
            <HeroGlassButton
              label="Enter The Vault"
              icon="play"
              tint={ACCENT}
              tintOpacity={0.92}
              size="large"
              onPress={handlePrimary}
            />
          ) : (
            <Pressable
              onPress={handlePrimary}
              style={({ pressed }) => [styles.continuePill, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.continueLabel}>Continue</Text>
              <Ionicons name="arrow-forward" size={18} color={INK_DARK} />
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

function SlideContent({
  slide,
  selectedGame,
  onSelectGame,
  roundPlayed,
  onPlayRound,
  adWatched,
  onWatchAd,
  selectedTier,
  onSelectTier,
  rewardPreview,
  selectedTierData,
  selectedChannel,
  onSelectChannel,
}: {
  slide: (typeof SLIDES)[number];
  selectedGame: GameId;
  onSelectGame: (id: GameId) => void;
  roundPlayed: boolean;
  onPlayRound: () => void;
  adWatched: boolean;
  onWatchAd: () => void;
  selectedTier: string;
  onSelectTier: (id: string) => void;
  rewardPreview: string;
  selectedTierData: (typeof TIERS)[number];
  selectedChannel: ChannelId;
  onSelectChannel: (id: ChannelId) => void;
}) {
  return (
    <View style={styles.slide}>
      <View style={styles.textBlock}>
        <Text style={styles.eyebrow}>{slide.eyebrow}</Text>
        <Text style={styles.headline}>{slide.title}</Text>
        <Text style={styles.subtext}>{slide.subtitle}</Text>
      </View>

      {slide.id === "game" ? (
        <GamePicker
          selectedGame={selectedGame}
          onSelectGame={onSelectGame}
          roundPlayed={roundPlayed}
          onPlayRound={onPlayRound}
        />
      ) : slide.id === "ad" ? (
        <AdSimulation adWatched={adWatched} onWatchAd={onWatchAd} />
      ) : slide.id === "estimate" ? (
        <EstimateReveal rewardPreview={rewardPreview} />
      ) : slide.id === "level" ? (
        <TierExplorer
          selectedTier={selectedTier}
          onSelectTier={onSelectTier}
          rewardPreview={rewardPreview}
          selectedTierData={selectedTierData}
        />
      ) : slide.id === "channels" ? (
        <ChannelPicker selectedChannel={selectedChannel} onSelectChannel={onSelectChannel} />
      ) : (
        <WalletPreview />
      )}
    </View>
  );
}

function GamePicker({
  selectedGame,
  onSelectGame,
  roundPlayed,
  onPlayRound,
}: {
  selectedGame: GameId;
  onSelectGame: (id: GameId) => void;
  roundPlayed: boolean;
  onPlayRound: () => void;
}) {
  return (
    <View style={styles.phoneFrame}>
      <View style={styles.gameGrid}>
        {GAMES.map((game) => {
          const active = selectedGame === game.id;
          return (
            <Pressable
              key={game.id}
              onPress={() => onSelectGame(game.id)}
              style={({ pressed }) => [
                styles.gameCard,
                active && styles.gameCardActive,
                pressed && { opacity: 0.85 },
              ]}
            >
              <MaterialCommunityIcons name={game.icon} size={34} color={INK_DARK} />
              <Text style={styles.gameTitle}>{game.label}</Text>
              <Text style={styles.gameMeta}>{game.meta}</Text>
              {active ? (
                <View style={styles.selectedBadge}>
                  <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.unlockStrip}>
        <View style={styles.unlockBadge}>
          <Ionicons name="shield-checkmark" size={13} color="#FFFFFF" />
        </View>
        <Text style={styles.unlockText}>
          Complete 1 short round to unlock 1 boosted ad
        </Text>
      </View>

      <Pressable
        onPress={onPlayRound}
        style={({ pressed }) => [styles.primaryAction, pressed && { opacity: 0.88 }]}
      >
        <Ionicons
          name={roundPlayed ? "checkmark-circle" : "play-circle"}
          size={22}
          color="#FFFFFF"
        />
        <Text style={styles.primaryActionText}>
          {roundPlayed ? "Round complete" : "Play first round"}
        </Text>
      </Pressable>
    </View>
  );
}

function AdSimulation({
  adWatched,
  onWatchAd,
}: {
  adWatched: boolean;
  onWatchAd: () => void;
}) {
  return (
    <View style={styles.phoneFrame}>
      <View style={styles.adHero}>
        <View style={styles.adPlay}>
          <Ionicons name={adWatched ? "checkmark" : "play"} size={26} color="#FFFFFF" />
        </View>
        <Text style={styles.adTitle}>{adWatched ? "Ad watched" : "Boost ready"}</Text>
        <Text style={styles.adStatus}>
          {adWatched ? "Reward is pending verification" : "Tap to simulate a rewarded ad"}
        </Text>
      </View>

      <Pressable
        onPress={onWatchAd}
        style={({ pressed }) => [styles.adButton, pressed && { opacity: 0.86 }]}
      >
        <Ionicons name="videocam-outline" size={16} color="#FFFFFF" />
        <Text style={styles.adButtonText}>{adWatched ? "Watched" : "Watch rewarded ad"}</Text>
      </Pressable>

      <View style={styles.softHint}>
        <View style={styles.softHintIcon}>
          <Ionicons name="information" size={13} color="#FFFFFF" />
        </View>
        <Text style={styles.softHintText}>
          Reward amounts are estimated first, then verified before cash out.
        </Text>
      </View>
    </View>
  );
}

function EstimateReveal({ rewardPreview }: { rewardPreview: string }) {
  return (
    <View style={styles.phoneFrame}>
      <View style={styles.adHero}>
        <View style={styles.adCheck}>
          <Ionicons name="checkmark" size={22} color="#FFFFFF" />
        </View>
        <Text style={styles.adTitle}>Ad watched</Text>
        <Text style={styles.adStatus}>Reward is pending verification</Text>
      </View>

      <View style={styles.watchedPill}>
        <Ionicons name="videocam-outline" size={16} color="#FFFFFF" />
        <Text style={styles.adButtonText}>Watched</Text>
      </View>

      <View style={styles.mathPanel}>
        <MathRow label="Estimated ad revenue" value="$0.0220" />
        <View style={styles.mathDivider} />
        <MathRow label="Your Starter share" value="30%" />
        <View style={styles.mathDivider} />
        <MathRow label="Pending reward" value={`$${rewardPreview}`} accent />
      </View>

      <View style={styles.softHintMuted}>
        <Ionicons name="information-circle-outline" size={16} color={V2.muted} />
        <Text style={styles.softHintTextMuted}>
          Pending rewards become available after review.
        </Text>
      </View>
    </View>
  );
}

function TierExplorer({
  selectedTier,
  onSelectTier,
  rewardPreview,
  selectedTierData,
}: {
  selectedTier: string;
  onSelectTier: (id: string) => void;
  rewardPreview: string;
  selectedTierData: (typeof TIERS)[number];
}) {
  return (
    <View style={styles.phoneFrame}>
      <View style={styles.tierHero}>
        <Text style={styles.tierHeroLabel}>Vault Level</Text>
        <Text style={styles.tierHeroTitle}>{selectedTierData.label}</Text>
        <Text style={styles.tierHeroSub}>
          {formatSharePercent(selectedTierData.shareBps)} share · {selectedTierData.cap}
        </Text>
        <View style={styles.tierTrack}>
          <MotiView
            animate={{ width: `${selectedTierData.progress * 100}%` }}
            transition={{ type: "spring", damping: 20, stiffness: 180 }}
            style={styles.tierFill}
          />
        </View>
      </View>

      <View style={styles.tierChips}>
        {TIERS.map((tier) => {
          const active = selectedTier === tier.id;
          return (
            <Pressable
              key={tier.id}
              onPress={() => onSelectTier(tier.id)}
              style={[styles.tierChip, active && styles.tierChipActive]}
            >
              <Text style={[styles.tierChipText, active && styles.tierChipTextActive]}>
                {tier.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.mathPanel}>
        <MathRow label="Current reward at this level" value={`$${rewardPreview}`} accent />
        <View style={styles.mathDivider} />
        <MathRow label="Higher tiers unlock" value="More share + faster review" small />
      </View>

      <View style={styles.softHintMuted}>
        <Ionicons name="information-circle-outline" size={16} color={ACCENT} />
        <Text style={styles.softHintTextMuted}>Level up by staying active and verified.</Text>
      </View>
    </View>
  );
}

function ChannelPicker({
  selectedChannel,
  onSelectChannel,
}: {
  selectedChannel: ChannelId;
  onSelectChannel: (id: ChannelId) => void;
}) {
  return (
    <View style={styles.phoneFrame}>
      {CHANNELS.map((channel) => {
        const active = selectedChannel === channel.id;
        return (
          <Pressable
            key={channel.id}
            onPress={() => onSelectChannel(channel.id)}
            style={[styles.channelRow, active && styles.channelRowActive]}
          >
            <View style={[styles.channelIcon, { backgroundColor: channel.tint }]}>
              <Ionicons name={channel.icon} size={20} color={INK_DARK} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.channelTitle}>{channel.title}</Text>
              <Text style={styles.channelDetail}>{channel.detail}</Text>
            </View>
            {active ? (
              <View style={styles.channelCheck}>
                <Ionicons name="checkmark" size={13} color="#FFFFFF" />
              </View>
            ) : (
              <Ionicons name="chevron-forward" size={18} color={V2.faint} />
            )}
          </Pressable>
        );
      })}

      <View style={styles.softHint}>
        <View style={styles.softHintIcon}>
          <Ionicons name="shield-checkmark" size={13} color="#FFFFFF" />
        </View>
        <Text style={styles.softHintText}>
          Partner rewards are confirmed before funds are released.
        </Text>
      </View>
    </View>
  );
}

function WalletPreview() {
  return (
    <View style={styles.phoneFrame}>
      <View style={styles.walletCard}>
        <Text style={styles.walletLabel}>Available balance</Text>
        <Text style={styles.walletValue}>$0.00</Text>
        <Text style={styles.walletSub}>Confirmed funds only</Text>
      </View>

      <View style={styles.walletGrid}>
        <WalletTile label="Pending" value="$0.00" tone="cyan" />
        <WalletTile label="Locked" value="$0.00" tone="amber" />
        <WalletTile label="Generated" value="$0.00" tone="plain" />
        <WalletTile label="Earned" value="$0.00" tone="plain" />
      </View>

      <View style={styles.flowStrip}>
        <Ionicons name="lock-closed-outline" size={14} color={V2.muted} />
        <Text style={styles.flowStepText}>Estimate</Text>
        <Ionicons name="arrow-forward" size={11} color={V2.faint} />
        <Text style={styles.flowStepText}>Pending</Text>
        <Ionicons name="arrow-forward" size={11} color={V2.faint} />
        <Text style={styles.flowStepText}>Verified</Text>
        <Ionicons name="arrow-forward" size={11} color={V2.faint} />
        <Text style={styles.flowStepText}>Available</Text>
      </View>
    </View>
  );
}

function MathRow({
  label,
  value,
  accent,
  small,
}: {
  label: string;
  value: string;
  accent?: boolean;
  small?: boolean;
}) {
  return (
    <View style={styles.mathRow}>
      <Text style={styles.mathLabel}>{label}</Text>
      <Text style={[styles.mathValue, small && { fontSize: 12 }, accent && { color: ACCENT }]}>
        {value}
      </Text>
    </View>
  );
}

function WalletTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "cyan" | "amber" | "plain";
}) {
  const tileStyle =
    tone === "cyan"
      ? styles.walletTileCyan
      : tone === "amber"
      ? styles.walletTileAmber
      : styles.walletTilePlain;
  return (
    <View style={[styles.walletTile, tileStyle]}>
      <Text style={styles.walletTileValue}>{value}</Text>
      <Text style={styles.walletTileLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: SURFACE,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  stepPill: {
    minHeight: 34,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  stepPillText: {
    ...typography.semibold,
    fontSize: 13,
    color: INK_DARK,
  },
  slidesContainer: {
    flex: 1,
  },
  slide: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 6,
  },
  textBlock: {
    marginTop: 8,
    marginBottom: 18,
  },
  eyebrow: {
    ...typography.bold,
    fontSize: 11,
    letterSpacing: 1.6,
    color: ACCENT,
    textTransform: "uppercase",
  },
  headline: {
    ...typography.bold,
    marginTop: 8,
    fontSize: 30,
    lineHeight: 35,
    letterSpacing: -0.6,
    color: INK_DARK,
  },
  subtext: {
    ...typography.regular,
    marginTop: 12,
    fontSize: 15,
    lineHeight: 21,
    color: "#5C6068",
  },
  phoneFrame: {
    flex: 1,
    minHeight: 320,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    backgroundColor: "#FFFFFF",
    padding: 16,
    shadowColor: "#0A1628",
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  gameGrid: {
    flexDirection: "row",
    gap: 10,
  },
  gameCard: {
    flex: 1,
    minHeight: 138,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    backgroundColor: "#F4F5F8",
    padding: 14,
    alignItems: "flex-start",
    justifyContent: "flex-end",
  },
  gameCardActive: {
    borderWidth: 2,
    borderColor: ACCENT,
    backgroundColor: ACCENT_SOFT,
  },
  gameTitle: {
    ...typography.bold,
    marginTop: 14,
    fontSize: 13,
    color: INK_DARK,
  },
  gameMeta: {
    ...typography.medium,
    marginTop: 3,
    fontSize: 11,
    color: "#7B7F87",
  },
  selectedBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
  },
  unlockStrip: {
    marginTop: 14,
    borderRadius: 14,
    backgroundColor: ACCENT_SOFT,
    borderWidth: 1,
    borderColor: "rgba(47,107,255,0.18)",
    paddingVertical: 11,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  unlockBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
  },
  unlockText: {
    ...typography.medium,
    flex: 1,
    fontSize: 13,
    color: INK_DARK,
  },
  primaryAction: {
    marginTop: 14,
    minHeight: 52,
    borderRadius: 26,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    shadowColor: ACCENT,
    shadowOpacity: 0.32,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  primaryActionText: {
    ...typography.bold,
    fontSize: 15,
    color: "#FFFFFF",
  },
  adHero: {
    minHeight: 170,
    borderRadius: 22,
    backgroundColor: "#1B1E25",
    alignItems: "center",
    justifyContent: "center",
    padding: 22,
  },
  adPlay: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    shadowColor: ACCENT,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
  },
  adCheck: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  adTitle: {
    ...typography.bold,
    fontSize: 19,
    color: "#FFFFFF",
    textAlign: "center",
  },
  adStatus: {
    ...typography.medium,
    marginTop: 4,
    fontSize: 13,
    color: "rgba(255,255,255,0.62)",
    textAlign: "center",
  },
  adButton: {
    marginTop: 14,
    minHeight: 50,
    borderRadius: 25,
    backgroundColor: "#0E1217",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  watchedPill: {
    marginTop: 14,
    minHeight: 50,
    borderRadius: 25,
    backgroundColor: "#0E1217",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  adButtonText: {
    ...typography.bold,
    fontSize: 14,
    color: "#FFFFFF",
  },
  softHint: {
    marginTop: 12,
    borderRadius: 14,
    backgroundColor: ACCENT_SOFT,
    borderWidth: 1,
    borderColor: "rgba(47,107,255,0.18)",
    paddingVertical: 11,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  softHintIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
  },
  softHintText: {
    ...typography.medium,
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    color: INK_DARK,
  },
  softHintMuted: {
    marginTop: 10,
    paddingHorizontal: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  softHintTextMuted: {
    ...typography.medium,
    flex: 1,
    fontSize: 12,
    color: V2.muted,
  },
  mathPanel: {
    marginTop: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.07)",
    backgroundColor: "#FAFBFD",
    padding: 14,
  },
  mathDivider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.06)",
    marginVertical: 2,
  },
  mathRow: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  mathLabel: {
    ...typography.medium,
    fontSize: 13,
    color: V2.muted,
  },
  mathValue: {
    ...typography.bold,
    fontSize: 14,
    color: INK_DARK,
  },
  tierHero: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.07)",
    backgroundColor: "#F2F5FB",
    padding: 18,
  },
  tierHeroLabel: {
    ...typography.bold,
    fontSize: 10,
    color: V2.muted,
    textTransform: "uppercase",
    letterSpacing: 1.4,
  },
  tierHeroTitle: {
    ...typography.bold,
    marginTop: 4,
    fontSize: 30,
    letterSpacing: -0.6,
    color: INK_DARK,
  },
  tierHeroSub: {
    ...typography.medium,
    marginTop: 6,
    fontSize: 13,
    color: V2.muted,
  },
  tierTrack: {
    marginTop: 14,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(14,18,23,0.08)",
    overflow: "hidden",
  },
  tierFill: {
    height: "100%",
    backgroundColor: ACCENT,
    borderRadius: 4,
  },
  tierChips: {
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tierChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    backgroundColor: "#FFFFFF",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tierChipActive: {
    backgroundColor: INK_DARK,
    borderColor: INK_DARK,
  },
  tierChipText: {
    ...typography.semibold,
    fontSize: 12,
    color: V2.muted,
  },
  tierChipTextActive: {
    color: "#FFFFFF",
  },
  channelRow: {
    minHeight: 72,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    backgroundColor: "#FAFBFD",
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  channelRowActive: {
    borderWidth: 1.5,
    borderColor: ACCENT,
    backgroundColor: ACCENT_SOFT,
  },
  channelIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  channelTitle: {
    ...typography.bold,
    fontSize: 15,
    color: INK_DARK,
  },
  channelDetail: {
    ...typography.medium,
    marginTop: 2,
    fontSize: 12,
    color: V2.muted,
  },
  channelCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
  },
  walletCard: {
    borderRadius: 22,
    backgroundColor: "#1B1E25",
    padding: 18,
  },
  walletLabel: {
    ...typography.bold,
    fontSize: 10,
    letterSpacing: 1.4,
    color: "rgba(255,255,255,0.6)",
    textTransform: "uppercase",
  },
  walletValue: {
    ...typography.bold,
    marginTop: 10,
    fontSize: 44,
    lineHeight: 48,
    letterSpacing: -1,
    color: "#FFFFFF",
  },
  walletSub: {
    ...typography.medium,
    marginTop: 4,
    fontSize: 13,
    color: "rgba(255,255,255,0.62)",
  },
  walletGrid: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  walletTile: {
    width: "48.5%",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    padding: 12,
  },
  walletTileCyan: {
    backgroundColor: "#E3EEFF",
  },
  walletTileAmber: {
    backgroundColor: "#FCE5BD",
  },
  walletTilePlain: {
    backgroundColor: "#F4F5F8",
  },
  walletTileValue: {
    ...typography.bold,
    fontSize: 18,
    color: INK_DARK,
  },
  walletTileLabel: {
    ...typography.medium,
    marginTop: 2,
    fontSize: 11,
    color: V2.muted,
  },
  flowStrip: {
    marginTop: 12,
    borderRadius: 14,
    backgroundColor: "#F4F5F8",
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  flowStepText: {
    ...typography.semibold,
    fontSize: 11,
    color: V2.muted,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingTop: 10,
    paddingBottom: 14,
  },
  dotHitArea: {
    minWidth: 22,
    minHeight: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    borderRadius: 4,
  },
  ctaWrap: {
    paddingHorizontal: 22,
    paddingBottom: 12,
  },
  continuePill: {
    minHeight: 56,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    paddingHorizontal: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#0A1628",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  continueLabel: {
    ...typography.bold,
    fontSize: 16,
    color: INK_DARK,
    flex: 1,
    textAlign: "center",
    marginLeft: 18,
  },
});
