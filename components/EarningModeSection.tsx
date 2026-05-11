import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import {
  type HubInAppGame,
  type HubOffer,
  type HubPartnerGame,
} from "../constants/gameCatalog";
import { GLASS } from "../constants/glassPalette";
import { typography } from "../constants/typography";
import { HeroGlassButton } from "./HeroGlassButton";

type IconName = React.ComponentProps<typeof Ionicons>["name"];
type MCIconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

export type EarningMode = "inapp" | "external" | "survey";

// ----------------------------------------------------------------------
// Section header

interface SectionHeaderProps {
  modeIcon: IconName;
  modeIconBg: string;
  title: string;
  earningBadge?: string;
  onSeeAll: () => void;
}

function SectionHeader({
  modeIcon,
  modeIconBg,
  title,
  earningBadge,
  onSeeAll,
}: SectionHeaderProps) {
  return (
    <View style={styles.headerRow}>
      <View style={styles.headerLeft}>
        <View style={[styles.modeIconWrap, { backgroundColor: modeIconBg }]}>
          <Ionicons name={modeIcon} size={15} color="#000000" />
        </View>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
      <View style={styles.headerRight}>
        {earningBadge ? (
          <View style={styles.earningBadge}>
            <Text style={styles.earningBadgeText}>{earningBadge}</Text>
          </View>
        ) : null}
        <Pressable
          onPress={onSeeAll}
          hitSlop={6}
          style={({ pressed }) => [
            styles.seeAllPressable,
            pressed && { opacity: 0.6 },
          ]}
        >
          <View pointerEvents="none" style={styles.seeAllContent}>
            <Text style={styles.seeAllText}>See all</Text>
            <Ionicons name="arrow-forward" size={11} color="#000000" />
          </View>
        </Pressable>
      </View>
    </View>
  );
}

// ----------------------------------------------------------------------
// Category CTAs — Liquid Glass play control (see THE_VAULT_UI_GUIDE.md).
// Per-section tints: blue = In-App, yellow = Partner, green = Surveys.
type CtaTheme = "blue" | "yellow" | "green";

const CTA_HERO_TINT: Record<CtaTheme, string> = {
  blue: "#7DD3FC",
  yellow: "#FFD55E",
  green: "#9FE7B5",
};

// ----------------------------------------------------------------------
// StandardHubCard — the single unified template for every hub card.
//
// All three category card types (InApp, Partner, Offer) are thin wrappers
// that map their data model onto these props. Visual logic lives here only.

interface HubCardBadge {
  label: string;
  bg: string;
  fg: string;
  liveDot?: boolean;
  ionIcon?: IconName;
}

interface StandardHubCardProps {
  title: string;
  earnInfo: string;
  icon: MCIconName;
  iconAreaBg: string;
  cardBg?: string;
  badge?: HubCardBadge;
  ctaTheme?: CtaTheme;
  onPress?: () => void;
}

function StandardHubCard({
  title,
  earnInfo,
  icon,
  iconAreaBg,
  cardBg = "#FFFFFF",
  badge,
  ctaTheme,
  onPress,
}: StandardHubCardProps) {
  return (
    // Outer View owns the fixed dimensions — Pressable cannot override them
    <View style={styles.card}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.cardInner,
          { backgroundColor: cardBg },
          pressed && { opacity: 0.88, transform: [{ scale: 0.97 }] },
        ]}
      >
        {/* Icon area — explicit height, never grows */}
        <View style={[styles.cardIconArea, { backgroundColor: iconAreaBg }]}>
          <MaterialCommunityIcons name={icon} size={52} color="#000000" />
          {badge ? (
            <View style={[styles.cardBadge, { backgroundColor: badge.bg }]}>
              {badge.liveDot ? (
                <View style={styles.liveDot} />
              ) : badge.ionIcon ? (
                <Ionicons name={badge.ionIcon} size={9} color={badge.fg} />
              ) : null}
              <Text style={[styles.cardBadgeText, { color: badge.fg }]}>
                {badge.label}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Title — fixed height so long names don't push CTA down */}
        <Text style={styles.cardTitle} numberOfLines={2}>{title}</Text>

        {/* Earn info — shown just above the CTA button */}
        <Text style={styles.cardEarnInfo} numberOfLines={1}>{earnInfo}</Text>

        {/* Absorbs extra vertical slack so Play/Go sit flush with the card bottom */}
        <View style={styles.cardCtaSpacer} />

        {/* CTA — glass play control (parent `Pressable` is the tap target) */}
        <View style={styles.cardCta}>
          <HeroGlassButton
            decorative
            iconOnly
            icon="play"
            accessibilityLabel={`Play ${title}`}
            tint={CTA_HERO_TINT[ctaTheme ?? "blue"]}
            tintOpacity={0.62}
            size="compact"
          />
        </View>
      </Pressable>
    </View>
  );
}

// ----------------------------------------------------------------------
// InAppGameCard — maps HubInAppGame → StandardHubCard

export function InAppGameCard({
  game,
  onPress,
}: {
  game: HubInAppGame;
  onPress?: () => void;
}) {
  const badge: HubCardBadge | undefined = game.badge
    ? {
        label: game.badge,
        bg:
          game.badge === "Live"
            ? "#7A1E2C"
            : game.badge === "Hot"
              ? "#FF7A00"
              : "#000000",
        fg: "#FFFFFF",
        liveDot: game.badge === "Live",
        ionIcon:
          game.badge === "Hot"
            ? "flame"
            : game.badge === "New"
              ? "sparkles"
              : undefined,
      }
    : undefined;

  return (
    <StandardHubCard
      title={game.title}
      earnInfo={`~ ${game.earnRate}`}
      icon={game.icon}
      iconAreaBg="rgba(255,255,255,0.62)"
      cardBg={game.cardColor}
      badge={badge}
      ctaTheme="blue"
      onPress={onPress}
    />
  );
}

// ----------------------------------------------------------------------
// PartnerGameCard — maps HubPartnerGame → StandardHubCard

export function PartnerGameCard({
  game,
  onPress,
}: {
  game: HubPartnerGame;
  onPress?: () => void;
}) {
  const difficultyBg =
    game.difficulty === "Easy"
      ? "#9FE2B5"
      : game.difficulty === "Medium"
        ? "#F6D98A"
        : "#F4A4A4";

  return (
    <StandardHubCard
      title={game.title}
      earnInfo={`Up to ${game.payout}`}
      icon={game.icon}
      iconAreaBg={game.iconBgColor}
      badge={{ label: game.difficulty, bg: difficultyBg, fg: "#000000" }}
      ctaTheme="yellow"
      onPress={onPress}
    />
  );
}

// ----------------------------------------------------------------------
// OfferCard — maps HubOffer → StandardHubCard

export function OfferCard({
  offer,
  onPress,
}: {
  offer: HubOffer;
  onPress?: () => void;
}) {
  const availabilityBg =
    offer.availability === "Hot"
      ? "#F4A4A4"
      : offer.availability === "Limited" || offer.availability === "Expiring"
        ? "#F6D98A"
        : "#9FE2B5";

  return (
    <StandardHubCard
      title={offer.title}
      earnInfo={`Up to ${offer.payout}`}
      icon={offer.icon}
      iconAreaBg={offer.iconBgColor}
      badge={{ label: offer.availability, bg: availabilityBg, fg: "#000000" }}
      ctaTheme="green"
      onPress={onPress}
    />
  );
}

// ----------------------------------------------------------------------
// EarningModeSection — section wrapper (unchanged API)

interface EarningModeSectionProps {
  modeIcon: IconName;
  modeIconBg: string;
  title: string;
  earningBadge?: string;
  onSeeAll: () => void;
  children: React.ReactNode;
  /**
   * When true, the horizontal strip does not bleed past the TabScreen gutter
   * (used inside LiquidGlassCard wrappers on the hub).
   */
  containScroll?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

export function EarningModeSection({
  modeIcon,
  modeIconBg,
  title,
  earningBadge,
  onSeeAll,
  children,
  containScroll = false,
  containerStyle,
}: EarningModeSectionProps) {
  return (
    <View style={[styles.section, containerStyle]}>
      <SectionHeader
        modeIcon={modeIcon}
        modeIconBg={modeIconBg}
        title={title}
        earningBadge={earningBadge}
        onSeeAll={onSeeAll}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        contentContainerStyle={
          containScroll ? styles.scrollContentContained : styles.scrollContent
        }
        style={containScroll ? undefined : styles.scrollBleed}
      >
        {children}
      </ScrollView>
    </View>
  );
}

// ----------------------------------------------------------------------
// Styles

const styles = StyleSheet.create({
  // Section wrapper
  section: {
    marginBottom: 26,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    gap: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modeIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    ...typography.bold,
    fontSize: 16,
    letterSpacing: -0.35,
    color: GLASS.ink,
  },
  earningBadge: {
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
  },
  earningBadgeText: {
    ...typography.bold,
    fontSize: 9,
    letterSpacing: 0.3,
    color: "#000000",
  },
  seeAllPressable: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  seeAllContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  seeAllText: {
    ...typography.bold,
    marginRight: 4,
    fontSize: 11,
    color: "#000000",
    letterSpacing: -0.1,
    textDecorationLine: "underline",
  },
  scrollBleed: {
    marginHorizontal: -24,
  },
  scrollContent: {
    paddingHorizontal: 24,
    gap: 14,
  },
  scrollContentContained: {
    gap: 14,
    paddingRight: 4,
  },

  // StandardHubCard outer shell — owns fixed dimensions, never bends to content
  card: {
    width: 136,
    height: 242,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: GLASS.charcoal,
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  // Pressable fills the shell exactly
  cardInner: {
    flex: 1,
    flexDirection: "column",
    paddingHorizontal: 11,
    paddingTop: 11,
    paddingBottom: 2,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
  },
  cardIconArea: {
    height: 108,
    flexShrink: 0,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.10)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  cardBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  cardBadgeText: {
    ...typography.bold,
    fontSize: 9,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
  },
  cardTitle: {
    ...typography.bold,
    marginTop: 8,
    height: 36,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: -0.3,
    color: "#000000",
  },
  cardEarnInfo: {
    ...typography.bold,
    marginTop: 2,
    fontSize: 10,
    letterSpacing: 0.1,
    color: GLASS.steelDeep,
  },
  cardCtaSpacer: {
    flexGrow: 1,
    flexShrink: 1,
    minHeight: 4,
  },
  cardCta: {
    marginTop: 4,
  },
});
