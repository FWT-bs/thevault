import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { formatSharePercent } from "@thevault/domain";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { FlatCard } from "../components/FlatCard";
import { HUB_INAPP_GAMES, HUB_OFFERS, HUB_PARTNER_GAMES } from "../constants/gameCatalog";
import { V2 } from "../constants/glassPalette";
import { typography } from "../constants/typography";
import { useCatalog } from "../services/features/catalog";
import { useVaultLevel } from "../services/features/vaultLevel";
import TabScreen from "./_tab-screen";

const FILTERS = ["All", "Hot", "New", "Cards", "Puzzle", "Arcade"] as const;

export default function GamesTab() {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<(typeof FILTERS)[number]>("All");
  const router = useRouter();
  const { data: catalogItems } = useCatalog();
  const { data: vaultLevel } = useVaultLevel();
  const apiInApp = (catalogItems ?? []).filter((i) => i.category === "in-app");
  const apiOffers = (catalogItems ?? []).filter((i) => i.category === "surveys");
  const shareLabel = formatSharePercent(vaultLevel?.revenueShareBps ?? 3000);

  return (
    <TabScreen
      title="Earn"
      subtitle="Pick a game and start earning credits"
      backgroundColor={V2.bg}
      titleColor={V2.ink}
      subtitleColor={V2.muted}
      contentContainerStyle={{ paddingTop: 0 }}
    >
      <View style={styles.searchShell}>
        <Ionicons name="search" size={18} color={V2.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search your favorite games"
          placeholderTextColor={V2.faint}
          style={styles.searchInput}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {FILTERS.map((label) => {
          const active = activeFilter === label;
          return (
            <Pressable key={label} onPress={() => setActiveFilter(label)} style={[styles.filterChip, active && styles.filterChipActive]}>
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <FlatCard radius={20} pad={14} style={styles.shareBanner}>
        <View style={styles.shareBannerIcon}>
          <Ionicons name="shield-checkmark" size={17} color={V2.cyan} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.shareBannerTitle}>{vaultLevel?.currentTier.shortName ?? "Starter"} share active</Text>
          <Text style={styles.shareBannerText}>
            Earn ad opportunities by playing. Rewarded ads estimate at {shareLabel} share, then verify into wallet balance.
          </Text>
        </View>
        <Pressable onPress={() => router.push("/vault-level")} style={styles.shareBannerButton}>
          <Text style={styles.shareBannerButtonText}>{shareLabel}</Text>
        </Pressable>
      </FlatCard>

      <FlatCard radius={26} pad={0} style={styles.featured}>
        <View style={styles.featuredTop}>
          <View style={styles.featuredChip}>
            <View style={styles.featuredDot} />
            <Text style={styles.featuredChipText}>FEATURED · ENDS IN 2H</Text>
          </View>
          <View style={styles.featuredIconWrap}>
            <MaterialCommunityIcons name="cards-diamond" size={26} color={V2.cyan} />
          </View>
          <Text style={styles.featuredTitle}>Midnight{"\n"}High Roller</Text>
          <Text style={styles.featuredSub}>Play a round · unlock rewarded ad boost</Text>
        </View>
        <View style={styles.featuredFooter}>
          <View>
            <Text style={styles.poolLabel}>Pool</Text>
            <Text style={styles.poolValue}>5,000 CR</Text>
            <Text style={styles.poolSub}>{shareLabel} ad-share eligible</Text>
          </View>
          <Pressable onPress={() => router.push("/games-in-app")} style={styles.playPrimary}>
            <Ionicons name="play" size={13} color="#FFFFFF" />
            <Text style={styles.playPrimaryText}>Play</Text>
          </Pressable>
        </View>
      </FlatCard>

      <SectionHeader title="In-App Games" onSeeAll={() => router.push("/games-in-app")} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
        {(apiInApp.length
          ? [...apiInApp, ...apiInApp].slice(0, 8).map((game, idx) => ({
              id: game.id,
              title: game.title,
              earnRate: game.rewardLabel,
            }))
          : [...HUB_INAPP_GAMES, ...HUB_INAPP_GAMES].slice(0, 8)
        ).map((game, idx) => (
          <GameTile
            key={`${game.id}-${idx}`}
            title={game.title}
            rate={`${game.earnRate}`}
            shareLabel={shareLabel}
            icon="game-controller-outline"
            onPress={() => {
              if (game.id === "blackjack") router.push("/blackjack");
              else if (game.id === "block-blast" || game.id === "block-puzzle") router.push("/block-blast");
              else if (game.id === "bricks-vs-balls") router.push("/bricks-vs-balls");
              else if (game.id === "color-stack") router.push("/color-stack");
              else router.push("/games-in-app");
            }}
          />
        ))}
      </ScrollView>

      <SectionHeader title="Partner Games" onSeeAll={() => router.push("/games-external")} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
        {[...HUB_PARTNER_GAMES, ...HUB_PARTNER_GAMES].slice(0, 8).map((game, idx) => (
          <GameTile key={`${game.id}-${idx}`} title={game.title} rate={game.payout} shareLabel="Partner verified" icon="rocket-outline" onPress={() => router.push("/games-external")} />
        ))}
      </ScrollView>

      <SectionHeader title="Surveys & Offers" onSeeAll={() => router.push("/offerwall")} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
        {(apiOffers.length
          ? [...apiOffers, ...apiOffers].slice(0, 8).map((offer, idx) => ({
              id: `${offer.id}-${idx}`,
              title: offer.title,
              payout: offer.rewardLabel,
            }))
          : [...HUB_OFFERS, ...HUB_OFFERS].slice(0, 8)
        ).map((offer, idx) => (
          <GameTile key={`${offer.id}-${idx}`} title={offer.title} rate={offer.payout} shareLabel="Verified payout" icon="clipboard-outline" onPress={() => router.push("/offerwall")} />
        ))}
      </ScrollView>
    </TabScreen>
  );
}

function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleWrap}>
        <View style={styles.sectionDot} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <Pressable
        onPress={onSeeAll}
        hitSlop={8}
        disabled={!onSeeAll}
        style={({ pressed }) => pressed && { opacity: 0.6 }}
      >
        <Text style={styles.sectionAction}>See all</Text>
      </Pressable>
    </View>
  );
}

function GameTile({
  title,
  rate,
  shareLabel,
  icon,
  onPress,
}: {
  title: string;
  rate: string;
  shareLabel: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  onPress: () => void;
}) {
  return (
    <FlatCard radius={18} pad={12} style={styles.tileCard}>
      <View style={styles.tileIconWrap}>
        <Ionicons name={icon} size={18} color={V2.cyan} />
      </View>
      <Text style={styles.tileTitle} numberOfLines={1}>
        {title}
      </Text>
      <Text style={styles.tileRate}>{rate}</Text>
      <Text style={styles.tileShare} numberOfLines={1}>{shareLabel}</Text>
      <Pressable onPress={onPress} style={styles.playPrimary}>
        <Ionicons name="play" size={12} color="#FFFFFF" />
        <Text style={styles.playPrimaryText}>Play</Text>
      </Pressable>
    </FlatCard>
  );
}

const styles = StyleSheet.create({
  searchShell: {
    height: 46,
    borderRadius: 23,
    backgroundColor: V2.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: V2.hairlineStrong,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchInput: {
    ...typography.bold,
    flex: 1,
    fontSize: 15,
    color: V2.ink,
    paddingVertical: 0,
  },
  filterRow: {
    gap: 8,
    paddingVertical: 12,
  },
  filterChip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: V2.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: V2.hairlineStrong,
  },
  filterChipActive: {
    backgroundColor: V2.ink,
    borderColor: V2.ink,
  },
  filterChipText: {
    ...typography.bold,
    color: V2.ink,
    fontSize: 13,
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
  shareBanner: {
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F7FCFF",
  },
  shareBannerIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: V2.cyanSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  shareBannerTitle: {
    ...typography.bold,
    fontSize: 14,
    color: V2.ink,
  },
  shareBannerText: {
    ...typography.semibold,
    marginTop: 2,
    fontSize: 11,
    lineHeight: 15,
    color: V2.muted,
  },
  shareBannerButton: {
    minHeight: 34,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: V2.hairlineStrong,
    paddingHorizontal: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  shareBannerButtonText: {
    ...typography.bold,
    fontSize: 12,
    color: V2.cyan,
  },
  featured: {
    marginBottom: 16,
    overflow: "hidden",
  },
  playPrimary: {
    minHeight: 34,
    borderRadius: 17,
    backgroundColor: "#000000",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  playPrimaryText: {
    ...typography.bold,
    fontSize: 12,
    color: "#FFFFFF",
  },
  featuredTop: {
    backgroundColor: V2.amberSoft,
    padding: 18,
  },
  featuredChip: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: V2.hairlineStrong,
    borderRadius: 7,
    paddingVertical: 4,
    paddingHorizontal: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  featuredDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: V2.amber,
  },
  featuredChipText: {
    ...typography.bold,
    fontSize: 10,
    color: V2.amberInk,
    letterSpacing: 0.7,
  },
  featuredIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    right: 18,
    top: 18,
  },
  featuredTitle: {
    ...typography.bold,
    marginTop: 10,
    fontSize: 24,
    lineHeight: 26,
    color: V2.ink,
    letterSpacing: -0.6,
  },
  featuredSub: {
    ...typography.semibold,
    marginTop: 6,
    color: V2.muted,
    fontSize: 13,
  },
  featuredFooter: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  poolLabel: {
    ...typography.bold,
    fontSize: 11,
    color: V2.muted,
    textTransform: "uppercase",
  },
  poolValue: {
    ...typography.bold,
    fontSize: 22,
    color: V2.ink,
    letterSpacing: -0.5,
  },
  poolSub: {
    ...typography.semibold,
    marginTop: 2,
    fontSize: 11,
    color: V2.muted,
  },
  sectionHeader: {
    marginTop: 8,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: V2.cyan,
  },
  sectionTitle: {
    ...typography.bold,
    fontSize: 15,
    color: V2.ink,
  },
  sectionAction: {
    ...typography.bold,
    fontSize: 13,
    color: V2.cyan,
  },
  carousel: {
    gap: 12,
    paddingBottom: 10,
    marginBottom: 4,
  },
  tileCard: {
    width: 132,
  },
  tileIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: V2.cyanSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  tileTitle: {
    ...typography.bold,
    fontSize: 15,
    color: V2.ink,
    marginBottom: 2,
  },
  tileRate: {
    ...typography.bold,
    fontSize: 12,
    color: V2.cyan,
    marginBottom: 2,
  },
  tileShare: {
    ...typography.semibold,
    fontSize: 10,
    color: V2.muted,
    marginBottom: 12,
  },
});
