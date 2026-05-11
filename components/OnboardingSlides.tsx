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

import { GLASS, V2 } from "../constants/glassPalette";
import { markOnboarded } from "../constants/onboardingState";
import { typography } from "../constants/typography";
import { HeroGlassButton } from "./HeroGlassButton";
import { LiquidGlassChip } from "./LiquidGlassChip";

type SlideId = "game" | "ad" | "level" | "channels" | "wallet";
type GameId = "blackjack" | "puzzle" | "trivia";
type ChannelId = "in-app" | "partner" | "surveys";

const SLIDES: { id: SlideId; eyebrow: string; title: string; subtitle: string }[] = [
  {
    id: "game",
    eyebrow: "Step 1",
    title: "Pick your first earning run",
    subtitle: "Choose a game. Finish a quick round to unlock one rewarded ad boost.",
  },
  {
    id: "ad",
    eyebrow: "Step 2",
    title: "Watch, estimate, verify",
    subtitle: "Ads estimate a reward first. Verified rewards move into your wallet.",
  },
  {
    id: "level",
    eyebrow: "Step 3",
    title: "Raise your share",
    subtitle: "Your Vault Level decides how much verified ad revenue is shared back with you.",
  },
  {
    id: "channels",
    eyebrow: "Step 4",
    title: "Earn beyond ads",
    subtitle: "Partner games and surveys use provider verification, so the app can pay more without weakening the wallet controls.",
  },
  {
    id: "wallet",
    eyebrow: "Step 5",
    title: "Cash out confirmed rewards",
    subtitle: "Available balance is redeemable. Pending and locked funds stay protected until verification clears.",
  },
];

const GAMES = [
  { id: "blackjack" as const, label: "Blackjack", meta: "Fast round", icon: "cards-playing-outline" as const, color: "#0B1729", dark: true },
  { id: "puzzle" as const, label: "Puzzle Rush", meta: "Low risk", icon: "puzzle-star" as const, color: "#A9E5FF" },
  { id: "trivia" as const, label: "Trivia Sprint", meta: "Skill boost", icon: "head-question-outline" as const, color: "#F6D98A" },
];

const TIERS = [
  { id: "starter", label: "Starter", shareBps: 3000, cap: "$0.50/day", color: "#E5E7EB" },
  { id: "bronze", label: "Bronze", shareBps: 3500, cap: "$1/day", color: "#FFD7C2" },
  { id: "silver", label: "Silver", shareBps: 4000, cap: "$2.50/day", color: "#A9E5FF" },
  { id: "gold", label: "Gold", shareBps: 4500, cap: "$5/day", color: "#F6D98A" },
  { id: "platinum", label: "Platinum", shareBps: 5000, cap: "$10/day", color: "#DED1FB" },
];

const CHANNELS = [
  { id: "in-app" as const, title: "In-app games", detail: "Play rounds, unlock ad boosts", icon: "game-controller-outline" as const, color: "#A9E5FF" },
  { id: "partner" as const, title: "Partner games", detail: "Install and milestone offers", icon: "rocket-outline" as const, color: "#FFD7C2" },
  { id: "surveys" as const, title: "Surveys", detail: "Higher payouts after callback", icon: "clipboard-outline" as const, color: "#CDEFD8" },
];

export function OnboardingSlides() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const listRef = useRef<FlatList<(typeof SLIDES)[number]>>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedGame, setSelectedGame] = useState<GameId>("blackjack");
  const [adWatched, setAdWatched] = useState(false);
  const [selectedTier, setSelectedTier] = useState("starter");
  const [selectedChannel, setSelectedChannel] = useState<ChannelId>("in-app");

  const isLast = activeIndex === SLIDES.length - 1;
  const activeSlide = SLIDES[activeIndex];
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
    if (activeSlide.id === "ad" && !adWatched) {
      setAdWatched(true);
      return;
    }
    if (isLast) handleFinish();
    else goToIndex(activeIndex + 1);
  }, [activeIndex, activeSlide.id, adWatched, goToIndex, handleFinish, isLast]);

  const renderSlide = useCallback(
    ({ item }: ListRenderItemInfo<(typeof SLIDES)[number]>) => (
      <View style={{ width, flex: 1 }}>
        <SlideContent
          slide={item}
          selectedGame={selectedGame}
          onSelectGame={setSelectedGame}
          adWatched={adWatched}
          onWatchAd={() => setAdWatched(true)}
          selectedTier={selectedTier}
          onSelectTier={setSelectedTier}
          rewardPreview={rewardPreview}
          selectedChannel={selectedChannel}
          onSelectChannel={setSelectedChannel}
        />
      </View>
    ),
    [adWatched, rewardPreview, selectedChannel, selectedGame, selectedTier, width],
  );

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right", "bottom"]}>
        <StatusBar style="dark" />

        <View style={styles.topRow}>
          <View style={styles.stepPill}>
            <Text style={styles.stepPillText}>{activeIndex + 1} / {SLIDES.length}</Text>
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
                    width: isActive ? 28 : 8,
                    opacity: isActive ? 1 : 0.42,
                  }}
                  transition={{ type: "spring", damping: 18, stiffness: 220 }}
                  style={styles.dot}
                />
              </Pressable>
            );
          })}
        </View>

        <View style={styles.ctaWrap}>
          <HeroGlassButton
            label={isLast ? "Enter The Vault" : activeSlide.id === "ad" && !adWatched ? "Watch ad" : "Continue"}
            icon={isLast ? undefined : "arrow-forward"}
            tint="#7DD3FC"
            tintOpacity={0.62}
            size="large"
            onPress={handlePrimary}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

function SlideContent({
  slide,
  selectedGame,
  onSelectGame,
  adWatched,
  onWatchAd,
  selectedTier,
  onSelectTier,
  rewardPreview,
  selectedChannel,
  onSelectChannel,
}: {
  slide: (typeof SLIDES)[number];
  selectedGame: GameId;
  onSelectGame: (id: GameId) => void;
  adWatched: boolean;
  onWatchAd: () => void;
  selectedTier: string;
  onSelectTier: (id: string) => void;
  rewardPreview: string;
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
        <GamePicker selectedGame={selectedGame} onSelectGame={onSelectGame} />
      ) : slide.id === "ad" ? (
        <AdSimulation selectedGame={selectedGame} adWatched={adWatched} onWatchAd={onWatchAd} rewardPreview={rewardPreview} />
      ) : slide.id === "level" ? (
        <TierExplorer selectedTier={selectedTier} onSelectTier={onSelectTier} rewardPreview={rewardPreview} />
      ) : slide.id === "channels" ? (
        <ChannelPicker selectedChannel={selectedChannel} onSelectChannel={onSelectChannel} />
      ) : (
        <WalletPreview />
      )}
    </View>
  );
}

function GamePicker({ selectedGame, onSelectGame }: { selectedGame: GameId; onSelectGame: (id: GameId) => void }) {
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
                { backgroundColor: game.color },
                active && styles.gameCardActive,
                pressed && { opacity: 0.86 },
              ]}
            >
              <MaterialCommunityIcons name={game.icon} size={28} color={game.dark ? "#FFFFFF" : "#000000"} />
              <Text style={[styles.gameTitle, game.dark && { color: "#FFFFFF" }]}>{game.label}</Text>
              <Text style={[styles.gameMeta, game.dark && { color: "rgba(255,255,255,0.7)" }]}>{game.meta}</Text>
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
        <Ionicons name="play-circle" size={15} color={V2.cyan} />
        <Text style={styles.unlockText}>Play a round to unlock an ad boost</Text>
      </View>
    </View>
  );
}

function AdSimulation({
  selectedGame,
  adWatched,
  onWatchAd,
  rewardPreview,
}: {
  selectedGame: GameId;
  adWatched: boolean;
  onWatchAd: () => void;
  rewardPreview: string;
}) {
  const game = GAMES.find((item) => item.id === selectedGame) ?? GAMES[0];
  return (
    <View style={styles.phoneFrame}>
      <View style={styles.adHero}>
        <View style={styles.adPlay}>
          <Ionicons name={adWatched ? "checkmark" : "play"} size={28} color="#FFFFFF" />
        </View>
        <Text style={styles.adTitle}>{adWatched ? "Ad complete" : `${game.label} boost ready`}</Text>
        <Text style={styles.adStatus}>{adWatched ? "Reward is pending verification" : "Tap to simulate a rewarded ad"}</Text>
      </View>
      <Pressable onPress={onWatchAd} style={styles.adButton}>
        <Ionicons name="videocam-outline" size={14} color="#FFFFFF" />
        <Text style={styles.adButtonText}>{adWatched ? "Watched" : "Watch rewarded ad"}</Text>
      </Pressable>
      {adWatched ? (
        <View style={styles.mathPanel}>
          <MathRow label="Estimated ad revenue" value="$0.0220" />
          <MathRow label="Your Starter share" value="30%" />
          <MathRow label="Pending reward" value={`$${rewardPreview}`} strong />
        </View>
      ) : (
        <View style={styles.simpleHint}>
          <Text style={styles.simpleHintText}>After the ad, The Vault shows the exact math before it becomes redeemable.</Text>
        </View>
      )}
    </View>
  );
}

function TierExplorer({
  selectedTier,
  onSelectTier,
  rewardPreview,
}: {
  selectedTier: string;
  onSelectTier: (id: string) => void;
  rewardPreview: string;
}) {
  const current = TIERS.find((tier) => tier.id === selectedTier) ?? TIERS[0];
  return (
    <View style={styles.phoneFrame}>
      <View style={[styles.tierHero, { backgroundColor: current.color }]}>
        <Text style={styles.tierHeroLabel}>Vault Level</Text>
        <Text style={styles.tierHeroTitle}>{current.label}</Text>
        <Text style={styles.tierHeroSub}>{formatSharePercent(current.shareBps)} share · {current.cap}</Text>
        <View style={styles.tierTrack}>
          <View style={[styles.tierFill, { width: selectedTier === "starter" ? "0%" : selectedTier === "platinum" ? "100%" : "68%" }]} />
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
              <Text style={[styles.tierChipText, active && styles.tierChipTextActive]}>{tier.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.mathPanel}>
        <MathRow label="$0.022 ad at this tier" value={`$${rewardPreview}`} strong />
        <MathRow label="Higher tiers unlock" value="More cap + faster review" />
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
            <View style={[styles.channelIcon, { backgroundColor: channel.color }]}>
              <Ionicons name={channel.icon} size={18} color="#000000" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.channelTitle}>{channel.title}</Text>
              <Text style={styles.channelDetail}>{channel.detail}</Text>
            </View>
            <Ionicons name={active ? "checkmark-circle" : "chevron-forward"} size={18} color={active ? V2.cyan : V2.faint} />
          </Pressable>
        );
      })}
      <View style={styles.unlockStrip}>
        <Ionicons name="receipt-outline" size={15} color={V2.cyan} />
        <Text style={styles.unlockText}>External rewards verify through partner callbacks</Text>
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
        <WalletTile label="Pending" value="$0.00" color="#A9E5FF" />
        <WalletTile label="Locked" value="$0.00" color="#F6D98A" />
        <WalletTile label="Generated" value="$0.00" color="#FFFFFF" />
        <WalletTile label="Earned" value="$0.00" color="#FFFFFF" />
      </View>
      <View style={styles.cashoutRule}>
        <Ionicons name="lock-closed-outline" size={14} color={V2.muted} />
        <Text style={styles.cashoutRuleText}>Estimated to pending to verified to available to redeemable</Text>
      </View>
    </View>
  );
}

function MathRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.mathRow}>
      <Text style={styles.mathLabel}>{label}</Text>
      <Text style={[styles.mathValue, strong && { color: V2.cyan }]}>{value}</Text>
    </View>
  );
}

function WalletTile({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[styles.walletTile, { backgroundColor: color }]}>
      <Text style={styles.walletTileValue}>{value}</Text>
      <Text style={styles.walletTileLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: V2.bg,
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
    minHeight: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    paddingHorizontal: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  stepPillText: {
    ...typography.bold,
    fontSize: 12,
    color: "#000000",
  },
  slidesContainer: {
    flex: 1,
  },
  slide: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  textBlock: {
    marginBottom: 16,
  },
  eyebrow: {
    ...typography.bold,
    fontSize: 10,
    letterSpacing: 1,
    color: V2.cyan,
    textTransform: "uppercase",
  },
  headline: {
    ...typography.bold,
    marginTop: 6,
    fontSize: 30,
    lineHeight: 35,
    color: "#000000",
  },
  subtext: {
    ...typography.medium,
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
    color: GLASS.inkSoft,
  },
  phoneFrame: {
    flex: 1,
    minHeight: 330,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "#FFFFFF",
    padding: 16,
    shadowColor: GLASS.charcoal,
    shadowOpacity: 0.1,
    shadowRadius: 16,
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
    borderColor: "rgba(0,0,0,0.1)",
    padding: 12,
    justifyContent: "flex-end",
  },
  gameCardActive: {
    borderWidth: 3,
    borderColor: "#000000",
  },
  gameTitle: {
    ...typography.bold,
    marginTop: 12,
    fontSize: 13,
    color: "#000000",
  },
  gameMeta: {
    ...typography.semibold,
    marginTop: 2,
    fontSize: 10,
    color: V2.muted,
  },
  selectedBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },
  unlockStrip: {
    marginTop: 14,
    borderRadius: 18,
    backgroundColor: "#F7FCFF",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  unlockText: {
    ...typography.semibold,
    flex: 1,
    fontSize: 12,
    color: V2.muted,
  },
  adHero: {
    flex: 1,
    minHeight: 150,
    borderRadius: 24,
    backgroundColor: "#1A1A1F",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  adPlay: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: V2.cyan,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  adTitle: {
    ...typography.bold,
    fontSize: 20,
    color: "#FFFFFF",
    textAlign: "center",
  },
  adStatus: {
    ...typography.semibold,
    marginTop: 5,
    fontSize: 12,
    color: "rgba(255,255,255,0.68)",
    textAlign: "center",
  },
  adButton: {
    marginTop: 12,
    minHeight: 44,
    borderRadius: 22,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
  },
  adButtonText: {
    ...typography.bold,
    fontSize: 13,
    color: "#FFFFFF",
  },
  simpleHint: {
    marginTop: 12,
    borderRadius: 18,
    backgroundColor: "#F7FCFF",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    padding: 12,
  },
  simpleHintText: {
    ...typography.semibold,
    fontSize: 12,
    lineHeight: 17,
    color: V2.muted,
  },
  mathPanel: {
    marginTop: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    backgroundColor: "#FFFFFF",
    padding: 12,
  },
  mathRow: {
    minHeight: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  mathLabel: {
    ...typography.semibold,
    fontSize: 12,
    color: V2.muted,
  },
  mathValue: {
    ...typography.bold,
    fontSize: 13,
    color: "#000000",
  },
  tierHero: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    padding: 16,
  },
  tierHeroLabel: {
    ...typography.bold,
    fontSize: 10,
    color: V2.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  tierHeroTitle: {
    ...typography.bold,
    marginTop: 4,
    fontSize: 28,
    color: "#000000",
  },
  tierHeroSub: {
    ...typography.semibold,
    marginTop: 4,
    fontSize: 13,
    color: V2.muted,
  },
  tierTrack: {
    marginTop: 14,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(0,0,0,0.12)",
    overflow: "hidden",
  },
  tierFill: {
    height: "100%",
    backgroundColor: "#000000",
  },
  tierChips: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tierChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "#FFFFFF",
    paddingVertical: 8,
    paddingHorizontal: 11,
  },
  tierChipActive: {
    backgroundColor: "#000000",
    borderColor: "#000000",
  },
  tierChipText: {
    ...typography.bold,
    fontSize: 11,
    color: V2.muted,
  },
  tierChipTextActive: {
    color: "#FFFFFF",
  },
  channelRow: {
    minHeight: 74,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    backgroundColor: "#FFFFFF",
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  channelRowActive: {
    borderWidth: 2,
    borderColor: V2.cyan,
  },
  channelIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  channelTitle: {
    ...typography.bold,
    fontSize: 15,
    color: "#000000",
  },
  channelDetail: {
    ...typography.semibold,
    marginTop: 2,
    fontSize: 11,
    color: V2.muted,
  },
  walletCard: {
    borderRadius: 24,
    backgroundColor: "#1A1A1F",
    padding: 18,
  },
  walletLabel: {
    ...typography.bold,
    fontSize: 10,
    letterSpacing: 1,
    color: "rgba(255,255,255,0.6)",
    textTransform: "uppercase",
  },
  walletValue: {
    ...typography.bold,
    marginTop: 8,
    fontSize: 46,
    lineHeight: 50,
    color: "#FFFFFF",
  },
  walletSub: {
    ...typography.semibold,
    marginTop: 4,
    fontSize: 12,
    color: "rgba(255,255,255,0.68)",
  },
  walletGrid: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  walletTile: {
    width: "48%",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    padding: 11,
  },
  walletTileValue: {
    ...typography.bold,
    fontSize: 17,
    color: "#000000",
  },
  walletTileLabel: {
    ...typography.semibold,
    marginTop: 2,
    fontSize: 10,
    color: V2.muted,
  },
  cashoutRule: {
    marginTop: 12,
    borderRadius: 16,
    backgroundColor: "#F5F5F7",
    padding: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cashoutRuleText: {
    ...typography.bold,
    flex: 1,
    fontSize: 11,
    lineHeight: 15,
    color: V2.muted,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingTop: 8,
    paddingBottom: 16,
  },
  dotHitArea: {
    minWidth: 30,
    minHeight: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#000000",
  },
  ctaWrap: {
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
});
