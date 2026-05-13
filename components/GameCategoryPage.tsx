import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { formatSharePercent } from "@thevault/domain";
import { Stack, useRouter } from "expo-router";
import { MotiView } from "moti";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  CATEGORY_TABS,
  GAME_ACTIVITIES,
  type CategoryId,
  type GameActivity,
} from "../constants/gameCatalog";
import { GLASS, GLASS_SURFACE } from "../constants/glassPalette";
import { typography } from "../constants/typography";
import { useCatalog } from "../services/features/catalog";
import { useVaultLevel } from "../services/features/vaultLevel";
import { useOfferAttributionIngest } from "../services/features/offers";
import TabScreen from "./TabScreen";
import { GlassSurface } from "./GlassSurface";

const PAGE_COPY: Record<CategoryId, { title: string; subtitle: string; kicker: string }> = {
  "in-app": {
    title: "In App Games",
    subtitle: "Play quick rounds without leaving The Vault",
    kicker: "Instant Play",
  },
  external: {
    title: "External Games",
    subtitle: "Partner games that pay credits back into your vault",
    kicker: "Partner Rewards",
  },
  surveys: {
    title: "Offerwall",
    subtitle: "Surveys, tasks, and streak offers for extra credits",
    kicker: "Surveys & Offers",
  },
};

export function GameCategoryPage({ category }: { category: CategoryId }) {
  const router = useRouter();
  const { data: catalogItems } = useCatalog();
  const { data: vaultLevel } = useVaultLevel();
  const offerAttribution = useOfferAttributionIngest();
  const tab = CATEGORY_TABS.find((item) => item.id === category) ?? CATEGORY_TABS[0];
  const copy = PAGE_COPY[category];
  const activities = GAME_ACTIVITIES.filter((activity) => activity.category === category);
  const count = catalogItems?.filter((item) => item.category === category).length ?? activities.length;
  const shareLabel = formatSharePercent(vaultLevel?.revenueShareBps ?? 3000);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: copy.title,
          headerBackTitle: "Earn",
          headerShadowVisible: false,
        }}
      />
      <TabScreen
        title={copy.title}
        subtitle={copy.subtitle}
        background={<CategoryBackdrop color={tab.color} />}
        backgroundColor="#FFFFFF"
        titleColor={GLASS.ink}
        subtitleColor={GLASS.inkMuted}
      >
      <MotiView
        from={{ opacity: 0, translateY: 12 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 420 }}
        style={[styles.pageIntro, { backgroundColor: tab.color }]}
      >
        <View style={styles.pageIntroTop}>
          <View style={styles.introIconPlate}>
            <MaterialCommunityIcons name={tab.icon} size={28} color="#000000" />
          </View>
          <View style={styles.countPill}>
            <Text style={styles.countPillText}>{count}</Text>
          </View>
        </View>
        <Text style={styles.kicker}>{copy.kicker}</Text>
        <Text style={styles.introTitle}>{tab.detail}</Text>
        <Text style={styles.introText}>
          Pick one activity below. Each row is ready to become its own deeper game or offer detail flow.
        </Text>
      </MotiView>

      <View style={styles.listHeader}>
        <Text style={styles.sectionLabel}>Available now</Text>
        <Text style={styles.sectionHint}>{category === "surveys" ? "Provider verified" : `${shareLabel} ad share`}</Text>
      </View>

        <GlassSurface
          tone="light"
          radius={20}
          intensity={34}
          style={styles.shareRailOutline}
          contentStyle={styles.shareRail}
        >
          <View style={styles.shareRailIcon}>
            <Ionicons name={category === "surveys" ? "receipt-outline" : "play-circle-outline"} size={16} color={GLASS.steelDeep} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.shareRailTitle}>
              {category === "surveys" ? "Completions verify before payout" : `Vault share: ${shareLabel}`}
            </Text>
            <Text style={styles.shareRailText}>
              {category === "surveys"
                ? "Offer rewards can stay pending while partner callbacks are checked."
                : "Ad boosts estimate first and become available after verification."}
            </Text>
          </View>
        </GlassSurface>

        {activities.map((activity, index) => (
          <MotiView
            key={activity.name}
            from={{ opacity: 0, translateY: 18, scale: 0.98 }}
            animate={{ opacity: 1, translateY: 0, scale: 1 }}
            transition={{ type: "timing", duration: 420, delay: 90 + index * 80 }}
            style={styles.activityGap}
          >
            <ActivityRow
              activity={activity}
              onPress={() => {
                if (category === "surveys") {
                  void offerAttribution.mutateAsync({
                    provider: "mock-offerwall",
                    clickId: `clk-${Date.now()}`,
                    offerId: activity.name.toLowerCase().replace(/\s+/g, "-"),
                  });
                  router.push("/offerwall");
                  return;
                }
                if (category === "in-app") {
                  router.push("/games-in-app");
                  return;
                }
                router.push("/games-external");
              }}
            />
          </MotiView>
        ))}
      </TabScreen>
    </>
  );
}

function ActivityRow({ activity, onPress }: { activity: GameActivity; onPress: () => void }) {
  const isDark = activity.tone === "dark";
  return (
    <GlassSurface
      tone={activity.tone}
      radius={22}
      intensity={36}
      onPress={onPress}
      style={styles.sectionOutline22}
      contentStyle={styles.activityRowContent}
    >
      <View style={styles.activityIconWrap}>
        <View
          style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(253,251,246,0.48)" }]}
          pointerEvents="none"
        />
        <MaterialCommunityIcons
          name={activity.icon}
          size={26}
          color={isDark ? "#FDFBF6" : GLASS.steelDeep}
        />
      </View>
      <View style={styles.activityInfo}>
        <View style={styles.activityTitleRow}>
          <Text style={[styles.activityTitle, isDark && styles.activityTitleDark]}>
            {activity.name}
          </Text>
          {activity.hot ? (
            <View style={styles.hotChip}>
              <Ionicons name="flame" size={10} color={GLASS.oxblood} />
              <Text style={styles.hotChipText}>Hot</Text>
            </View>
          ) : null}
        </View>
        <Text style={[styles.activityMeta, isDark && styles.activityMetaDark]}>
          {activity.tag} · {activity.players}
        </Text>
      </View>
      <View style={styles.rewardBlock}>
        <Text style={[styles.rewardValue, isDark && styles.rewardValueDark]}>
          {activity.payout}
        </Text>
        <Text style={[styles.rewardLabel, isDark && styles.rewardLabelDark]}>
          Reward
        </Text>
      </View>
    </GlassSurface>
  );
}

function CategoryBackdrop({ color }: { color: string }) {
  return <View style={[StyleSheet.absoluteFillObject, { backgroundColor: color }]} pointerEvents="none" />;
}

const styles = StyleSheet.create({
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
  },
  pageIntro: {
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    padding: 16,
    marginBottom: 22,
    shadowColor: GLASS.charcoal,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  pageIntroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  introIconPlate: {
    width: 48,
    height: 48,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "#FFFFFF",
  },
  countPill: {
    minWidth: 36,
    height: 30,
    paddingHorizontal: 11,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
  },
  countPillText: {
    ...typography.bold,
    fontSize: 12,
    color: "#000000",
  },
  kicker: {
    ...typography.bold,
    fontSize: 9,
    letterSpacing: 1.3,
    textTransform: "uppercase",
    color: GLASS.inkMuted,
  },
  introTitle: {
    ...typography.bold,
    marginTop: 4,
    fontSize: 24,
    lineHeight: 28,
    color: "#000000",
    letterSpacing: -0.7,
  },
  introText: {
    ...typography.medium,
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
    color: GLASS.inkSoft,
    letterSpacing: -0.1,
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionLabel: {
    ...typography.bold,
    fontSize: 12,
    color: "#000000",
  },
  sectionHint: {
    ...typography.semibold,
    fontSize: 11,
    color: GLASS.inkMuted,
  },
  shareRailOutline: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    borderRadius: 20,
    marginBottom: 12,
  },
  shareRail: {
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  shareRailIcon: {
    width: 36,
    height: 36,
    borderRadius: 13,
    backgroundColor: "rgba(169,229,255,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  shareRailTitle: {
    ...typography.bold,
    fontSize: 13,
    color: GLASS.ink,
  },
  shareRailText: {
    ...typography.semibold,
    marginTop: 2,
    fontSize: 11,
    lineHeight: 15,
    color: GLASS.inkMuted,
  },
  activityGap: {
    marginBottom: 12,
  },
  sectionOutline22: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    borderRadius: 22,
  },
  activityRowContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 14,
  },
  activityIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 18,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: GLASS_SURFACE.edge,
  },
  activityInfo: {
    flex: 1,
    minWidth: 0,
  },
  activityTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  activityTitle: {
    ...typography.bold,
    fontSize: 17,
    color: GLASS.ink,
    letterSpacing: -0.3,
  },
  activityTitleDark: {
    color: "#FDFBF6",
  },
  activityMeta: {
    ...typography.regular,
    marginTop: 2,
    fontSize: 12,
    color: GLASS.inkMuted,
  },
  activityMetaDark: {
    color: "rgba(253,251,246,0.68)",
  },
  hotChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 999,
    backgroundColor: "rgba(122,30,44,0.14)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(122,30,44,0.32)",
  },
  hotChipText: {
    ...typography.bold,
    fontSize: 9,
    letterSpacing: 1,
    color: GLASS.oxblood,
  },
  rewardBlock: {
    alignItems: "flex-end",
  },
  rewardValue: {
    ...typography.bold,
    fontSize: 15,
    color: GLASS.steelDeep,
    letterSpacing: -0.3,
  },
  rewardValueDark: {
    color: "#FDFBF6",
  },
  rewardLabel: {
    ...typography.semibold,
    marginTop: 2,
    fontSize: 9,
    letterSpacing: 1.2,
    color: GLASS.inkMuted,
    textTransform: "uppercase",
  },
  rewardLabelDark: {
    color: "rgba(253,251,246,0.64)",
  },
});
