import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { FlatCard } from "../components/FlatCard";
import { V2 } from "../constants/glassPalette";
import { typography } from "../constants/typography";
import { streakClaim } from "../lib/streakClaim";
import TabScreen from "./_tab-screen";

const RECOMMENDED = [
  { title: "Midnight High Roller", meta: "~12 CR/min", chip: "HOT", color: V2.amberSoft },
  { title: "Block Puzzle Sprint", meta: "2.4x boost", chip: "FAST", color: V2.cyanSoft },
];

const CLAIMED_GREEN_BG = "#E5F8EC";
const CLAIMED_GREEN_BORDER = "#B5E8C9";
/** Softer readable green for check icons / “Claimed” label */
const CLAIMED_GREEN_INK = "#3D8F5A";
/** Pastel fill for day check circles */
const CLAIMED_CHECK_CIRCLE_BG = "#8FDFAC";
const SHARE_WATCH_BG = "#000000"; // Black

export default function HomeTab() {
  const router = useRouter();
  const claimed = useSyncExternalStore(
    streakClaim.subscribe,
    streakClaim.isClaimed,
    streakClaim.isClaimed,
  );
  const [animatedEarnings, setAnimatedEarnings] = useState(0);
  const targetEarnings = 24.8;

  useEffect(() => {
    let frame = 0;
    const durationMs = 1400;
    const start = Date.now();

    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / durationMs, 1);
      // Ease-out so the last digits settle smoothly.
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedEarnings(targetEarnings * eased);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const earningsWhole = Math.floor(animatedEarnings);
  const earningsCents = Math.round((animatedEarnings - earningsWhole) * 100)
    .toString()
    .padStart(2, "0");
  const streakDays = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 7 }, (_, idx) => {
      const offset = idx - 3;
      const d = new Date(now);
      d.setDate(now.getDate() + offset);
      return {
        key: `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`,
        weekday: d.toLocaleDateString("en-US", { weekday: "short" }),
        dayNum: d.getDate(),
        isToday: offset === 0,
      };
    });
  }, []);

  return (
    <TabScreen
      title="Home"
      subtitle="Welcome back, Alex"
      backgroundColor={V2.bg}
      titleColor={V2.ink}
      subtitleColor={V2.muted}
      headerAccessory={
        <View style={styles.headerAvatar}>
          <Text style={styles.headerAvatarText}>A</Text>
        </View>
      }
    >
      <FlatCard radius={26} pad={20} style={{ marginBottom: 14 }}>
        <Text style={styles.heroLabel}>Today's earnings</Text>
        <View style={styles.heroValueRow}>
          <Text style={styles.heroPlus}>+</Text>
          <Text style={styles.heroWhole}>${earningsWhole}</Text>
          <Text style={styles.heroFraction}>.{earningsCents}</Text>
        </View>
        <View style={styles.growthPill}>
          <Text style={styles.growthText}>↑ 18% vs yesterday</Text>
        </View>
        <View style={styles.heroButtons}>
          <View style={{ flex: 1 }}>
            <Pressable onPress={() => router.push("/games-tab")} style={styles.blueButton}>
              <Ionicons name="flash" size={15} color="#FFFFFF" />
              <Text style={styles.blueButtonText}>Earn now</Text>
            </Pressable>
          </View>
          <View style={{ flex: 1 }}>
            <Pressable onPress={() => router.push("/redeem")} style={styles.cashOutButton}>
              <Ionicons name="arrow-down-circle" size={15} color="#FFFFFF" />
              <Text style={styles.cashOutButtonText}>Cash out</Text>
            </Pressable>
          </View>
        </View>
      </FlatCard>

      <FlatCard radius={20} pad={20} style={{ marginBottom: 12 }}>
        <Text style={[styles.streakTitle, { textAlign: "center", marginBottom: 18 }]}>
          7-day streak · +25% bonus
        </Text>

        <View style={styles.streakCalendarRow}>
          {streakDays.map((item) => {
            const isPastOrClaimedToday =
              item.dayNum < new Date().getDate() || (item.isToday && claimed);
            return (
              <View
                key={item.key}
                style={[
                  styles.dayChip,
                  item.isToday && !isPastOrClaimedToday && styles.dayChipToday,
                  isPastOrClaimedToday && styles.dayChipClaimed,
                ]}
              >
                {isPastOrClaimedToday ? (
                  <View style={styles.dayClaimedCircle}>
                    <MaterialCommunityIcons name="check-bold" size={20} color="#0D3D1F" />
                  </View>
                ) : (
                  <>
                    <Text
                      style={[
                        styles.dayWeekText,
                        item.isToday && styles.dayWeekTextToday,
                      ]}
                    >
                      {item.weekday}
                    </Text>
                    <Text
                      style={[
                        styles.dayNumText,
                        item.isToday && styles.dayNumTextToday,
                      ]}
                    >
                      {item.dayNum}
                    </Text>
                  </>
                )}
              </View>
            );
          })}
        </View>

        <Pressable
          onPress={() => {
            if (!claimed) router.push("/streak-claim");
          }}
          style={[styles.claimNowButton, claimed && styles.claimNowButtonClaimed]}
          disabled={claimed}
        >
          {claimed ? (
            <View style={styles.claimedRow}>
              <MaterialCommunityIcons
                name="checkbox-marked-circle"
                size={24}
                color={CLAIMED_GREEN_INK}
              />
              <Text style={styles.claimedText}>Claimed</Text>
            </View>
          ) : (
            <Text style={styles.claimNowText}>Claim now</Text>
          )}
        </Pressable>
      </FlatCard>

      <FlatCard radius={20} pad={20} style={{ marginBottom: 16 }}>
        <View style={styles.statsRow}>
          <MetricCard value="$2,450.75" label="Current Balance" icon="wallet-outline" />
          <MetricCard value="128" label="Ads Watched" icon="game-controller-outline" />
          <MetricCard value="$74" label="Total Earnings" icon="trophy-outline" />
        </View>

        <Pressable
          style={styles.walletButton}
          onPress={() => router.push("/wallet-tab")}
        >
          <Text style={styles.walletButtonText}>Go to Wallet</Text>
        </Pressable>
      </FlatCard>

      <View style={styles.quickActionsRow}>
        <Pressable
          style={{ flex: 1 }}
          onPress={() => router.push("/invite")}
        >
          <FlatCard radius={18} pad={14} style={styles.quickActionCard}>
            <View style={styles.quickActionIconWrap}>
              <Ionicons name="share-social-outline" size={16} color={V2.cyan} />
            </View>
            <Text style={styles.quickActionTitle}>Referral credits</Text>
            <Text style={styles.quickActionMeta}>Share and earn bonus CR</Text>
            <Pressable
              style={styles.extraActionButton}
              onPress={() => {
                // Share action - add your share logic here
              }}
            >
              <Ionicons name="share" size={14} color="#FFFFFF" />
              <Text style={styles.extraActionButtonText}>Share</Text>
            </Pressable>
          </FlatCard>
        </Pressable>
        <Pressable style={{ flex: 1 }}>
          <FlatCard radius={18} pad={14} style={styles.quickActionCard}>
            <View style={[styles.quickActionIconWrap, styles.quickActionIconWrapAmber]}>
              <Ionicons name="play-circle-outline" size={16} color={V2.amber} />
            </View>
            <Text style={styles.quickActionTitle}>Watch extra ad</Text>
            <Text style={styles.quickActionMeta}>Get a quick CR boost</Text>
            <Pressable
              style={styles.extraActionButton}
              onPress={() => {
                // Watch extra ad action
              }}
            >
              <Ionicons name="eye" size={14} color="#FFFFFF" />
              <Text style={styles.extraActionButtonText}>Watch</Text>
            </Pressable>
          </FlatCard>
        </Pressable>
      </View>

      <View style={styles.sectionHeader}>
        <View style={styles.sectionLeft}>
          <View style={styles.sectionDot} />
          <Text style={styles.sectionTitle}>Recommended</Text>
        </View>
        <Text style={styles.sectionAction}>See all</Text>
      </View>

      <FlatCard radius={22} pad={0}>
        {RECOMMENDED.map((item, idx) => (
          <Pressable
            key={item.title}
            onPress={() => router.push("/games-tab")}
            style={[styles.recoRow, idx < RECOMMENDED.length - 1 && styles.recoBorder]}
          >
            <View style={[styles.recoIconWrap, { backgroundColor: item.color }]}>
              <MaterialCommunityIcons name="cards-diamond" size={22} color={V2.cyan} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.recoMetaTop}>
                <Text style={[styles.recoChip, item.chip === "HOT" ? styles.recoChipAmber : styles.recoChipCyan]}>
                  {item.chip}
                </Text>
                <Text style={styles.recoMeta}>{item.meta}</Text>
              </View>
              <Text style={styles.recoTitle}>{item.title}</Text>
            </View>
            <Pressable onPress={() => router.push("/games-tab")} style={styles.recoPlayPill}>
              <Ionicons name="play" size={12} color="#FFFFFF" />
              <Text style={styles.recoPlayText}>Play</Text>
            </Pressable>
          </Pressable>
        ))}
      </FlatCard>
    </TabScreen>
  );
}

function MetricCard({
  value,
  label,
  icon,
}: {
  value: string;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
}) {
  return (
    <FlatCard radius={18} pad={12} style={{ flex: 1, minWidth: 80 }}>
      <View style={styles.metricIconWrap}>
        <Ionicons name={icon} size={14} color={V2.cyan} />
      </View>
      <Text style={styles.metricValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.metricLabel} numberOfLines={1}>
        {label}
      </Text>
    </FlatCard>
  );
}

const styles = StyleSheet.create({
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: V2.cyan,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: V2.cyan,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  headerAvatarText: {
    ...typography.bold,
    color: "#FFFFFF",
    fontSize: 16,
  },
  heroLabel: {
    ...typography.semibold,
    fontSize: 16,
    color: V2.muted,
  },
  heroValueRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
  },
  heroPlus: {
    ...typography.semibold,
    fontSize: 42,
    lineHeight: 50,
    color: V2.ink,
    opacity: 0.9,
  },
  heroWhole: {
    ...typography.bold,
    fontSize: 56,
    lineHeight: 60,
    color: V2.ink,
    letterSpacing: -2,
  },
  heroFraction: {
    ...typography.bold,
    fontSize: 30,
    color: V2.muted,
    marginBottom: 8,
  },
  growthPill: {
    alignSelf: "flex-start",
    marginTop: 4,
    backgroundColor: "#E8F8EC",
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 8,
  },
  growthText: {
    ...typography.bold,
    color: "#0F7A2E",
    fontSize: 13,
  },
  heroButtons: {
    marginTop: 18,
    flexDirection: "row",
    gap: 10,
  },
  blueButton: {
    minHeight: 48,
    borderRadius: 24,
    backgroundColor: V2.blueDeep,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  blueButtonText: {
    ...typography.bold,
    fontSize: 16,
    color: "#FFFFFF",
  },
  cashOutButton: {
    minHeight: 48,
    borderRadius: 24,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  cashOutButtonText: {
    ...typography.bold,
    fontSize: 16,
    color: "#FFFFFF",
  },
  walletButton: {
    minHeight: 52,
    borderRadius: 26,
    backgroundColor: V2.blueDeep,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    width: "100%",
  },
  walletButtonText: {
    ...typography.bold,
    fontSize: 16,
    color: "#FFFFFF",
  },
  streakTitle: {
    ...typography.bold,
    fontSize: 14,
    color: V2.ink,
  },
  streakCalendarRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  dayChip: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 2,
    borderRadius: 14,
    backgroundColor: "#F5F5F5",
    marginHorizontal: 3,
    minHeight: 64,
  },
  dayChipToday: {
    backgroundColor: "#EBF3FF",
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  dayChipClaimed: {
    backgroundColor: CLAIMED_GREEN_BG,
    borderWidth: 1,
    borderColor: CLAIMED_GREEN_BORDER,
    paddingVertical: 8,
  },
  dayClaimedCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: CLAIMED_CHECK_CIRCLE_BG,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(61,143,90,0.35)",
  },
  dayWeekText: {
    ...typography.semibold,
    fontSize: 11,
    color: V2.muted,
    letterSpacing: 0.2,
  },
  dayWeekTextToday: {
    color: V2.cyan,
  },
  dayNumText: {
    ...typography.bold,
    marginTop: 4,
    fontSize: 17,
    color: V2.ink,
    letterSpacing: -0.3,
  },
  dayNumTextToday: {
    color: V2.cyan,
  },
  claimNowButton: {
    backgroundColor: "#000000",
    paddingVertical: 14,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  claimNowButtonClaimed: {
    backgroundColor: CLAIMED_GREEN_BG,
    borderWidth: 1,
    borderColor: CLAIMED_GREEN_BORDER,
  },
  claimNowText: {
    ...typography.bold,
    color: "#FFFFFF",
    fontSize: 16,
  },
  claimedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  claimedText: {
    ...typography.bold,
    fontSize: 16,
    color: CLAIMED_GREEN_INK,
    letterSpacing: -0.2,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 0,
  },
  metricValue: {
    ...typography.bold,
    fontSize: 20,
    color: V2.ink,
    letterSpacing: -0.5,
  },
  metricIconWrap: {
    alignSelf: "flex-start",
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: V2.cyanSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  metricLabel: {
    ...typography.semibold,
    marginTop: 2,
    fontSize: 11,
    color: V2.muted,
  },
  quickActionsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  quickActionCard: {
    minHeight: 94,
  },
  quickActionIconWrap: {
    alignSelf: "flex-start",
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: V2.cyanSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  quickActionIconWrapAmber: {
    backgroundColor: V2.amberSoft,
  },
  quickActionTitle: {
    ...typography.bold,
    fontSize: 13,
    color: V2.ink,
  },
  quickActionMeta: {
    ...typography.semibold,
    marginTop: 2,
    fontSize: 10,
    color: V2.muted,
  },
  extraActionButton: {
    marginTop: 8,
    backgroundColor: SHARE_WATCH_BG,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: "flex-start",
    width: "100%",
  },
  extraActionButtonText: {
    ...typography.semibold,
    fontSize: 11,
    color: "#FFFFFF",
    marginLeft: 4,
  },
  sectionHeader: {
    marginVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionLeft: {
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
  recoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  recoBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: V2.hairline,
  },
  recoIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  recoMetaTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  recoChip: {
    ...typography.bold,
    fontSize: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    letterSpacing: 0.8,
  },
  recoChipAmber: {
    color: V2.amberInk,
    backgroundColor: V2.amberSoft,
  },
  recoChipCyan: {
    color: V2.cyanInk,
    backgroundColor: V2.cyanSoft,
  },
  recoMeta: {
    ...typography.semibold,
    fontSize: 11,
    color: V2.muted,
  },
  recoTitle: {
    ...typography.bold,
    marginTop: 4,
    fontSize: 16,
    color: V2.ink,
  },
  recoPlayPill: {
    minHeight: 34,
    borderRadius: 17,
    paddingHorizontal: 12,
    backgroundColor: V2.blueDeep,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  recoPlayText: {
    ...typography.bold,
    fontSize: 12,
    color: "#FFFFFF",
  },
});
