import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { FlatCard } from "../components/FlatCard";
import { HUB_INAPP_GAMES, HUB_OFFERS, HUB_PARTNER_GAMES } from "../constants/gameCatalog";
import { V2 } from "../constants/glassPalette";
import { typography } from "../constants/typography";
import TabScreen from "./_tab-screen";

const FILTERS = ["All", "Hot", "New", "Cards", "Puzzle", "Arcade"] as const;

export default function GamesTab() {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<(typeof FILTERS)[number]>("All");
  const router = useRouter();

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
          <Text style={styles.featuredSub}>5,000 CR prize pool · cards</Text>
        </View>
        <View style={styles.featuredFooter}>
          <View>
            <Text style={styles.poolLabel}>Pool</Text>
            <Text style={styles.poolValue}>5,000 CR</Text>
          </View>
          <Pressable onPress={() => router.push("/games-in-app")} style={styles.playPrimary}>
            <Ionicons name="play" size={13} color="#FFFFFF" />
            <Text style={styles.playPrimaryText}>Play</Text>
          </Pressable>
        </View>
      </FlatCard>

      <SectionHeader title="In-App Games" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
        {[...HUB_INAPP_GAMES, ...HUB_INAPP_GAMES].slice(0, 8).map((game, idx) => (
          <GameTile
            key={`${game.id}-${idx}`}
            title={game.title}
            rate={`${game.earnRate}`}
            icon="game-controller-outline"
            onPress={() => (game.id === "blackjack" ? router.push("/blackjack") : router.push("/games-in-app"))}
          />
        ))}
      </ScrollView>

      <SectionHeader title="Partner Games" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
        {[...HUB_PARTNER_GAMES, ...HUB_PARTNER_GAMES].slice(0, 8).map((game, idx) => (
          <GameTile key={`${game.id}-${idx}`} title={game.title} rate={game.payout} icon="rocket-outline" onPress={() => router.push("/games-external")} />
        ))}
      </ScrollView>

      <SectionHeader title="Surveys & Offers" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
        {[...HUB_OFFERS, ...HUB_OFFERS].slice(0, 8).map((offer, idx) => (
          <GameTile key={`${offer.id}-${idx}`} title={offer.title} rate={offer.payout} icon="clipboard-outline" onPress={() => router.push("/offerwall")} />
        ))}
      </ScrollView>
    </TabScreen>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleWrap}>
        <View style={styles.sectionDot} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <Text style={styles.sectionAction}>See all</Text>
    </View>
  );
}

function GameTile({
  title,
  rate,
  icon,
  onPress,
}: {
  title: string;
  rate: string;
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
    marginBottom: 12,
  },
});
