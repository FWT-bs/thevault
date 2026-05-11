import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  GT,
  type GameConfig,
  type GameLaunchIcon,
  type GameLaunchRow,
} from "../../constants/gameTemplates";
import { V2 } from "../../constants/glassPalette";
import { typography } from "../../constants/typography";
import { GameArt } from "./GameArt";

type Props = {
  gameConfig: GameConfig;
  onBack?: () => void;
  onPlay?: () => void;
  modeOptions?: GameLaunchModeOption[];
  selectedModeId?: string;
  onModeChange?: (id: string) => void;
  showHeaderBalance?: boolean;
};

type MciName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];
type IonName = React.ComponentProps<typeof Ionicons>["name"];

type GameLaunchModeOption = {
  id: string;
  label: string;
  description: string;
};

const FEATURE_ICONS: Record<GameLaunchIcon, MciName> = {
  rocket: "rocket-launch-outline",
  target: "target",
  calendar: "calendar-blank-outline",
  rules: "text-box-outline",
  fairPlay: "shield-check-outline",
  rewards: "gift-outline",
  practice: "school-outline",
  cards: "cards-playing-spade-multiple-outline",
  shield: "shield-star-outline",
};

export function GameLaunchPage({
  gameConfig,
  onBack,
  onPlay,
  modeOptions,
  selectedModeId,
  onModeChange,
  showHeaderBalance = true,
}: Props) {
  const cfg = gameConfig;
  const launch = cfg.launch;
  const hasModeOptions = Boolean(modeOptions?.length);

  return (
    <View style={styles.root}>
      <View pointerEvents="none" style={[styles.backdrop, { backgroundColor: cfg.accentSoft }]} />

      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 280 }}
            style={styles.header}
          >
            <View style={styles.headerBackSlot}>
              <CircleButton
                accessibilityLabel="Back"
                icon="arrow-back"
                onPress={onBack}
              />
            </View>

            <View style={styles.headerCenter}>
              <Text numberOfLines={1} adjustsFontSizeToFit style={styles.headerTitle}>
                {cfg.name}
              </Text>
              <View style={styles.levelPill}>
                <View style={styles.crownMark}>
                  <MaterialCommunityIcons name="crown" size={15} color="#7A4A00" />
                </View>
                <Text style={styles.levelText}>{launch.levelLabel}</Text>
                <View style={styles.levelDivider} />
                <Text style={[styles.shareText, { color: cfg.accent }]}>
                  {launch.shareLabel}
                </Text>
                <Text style={styles.shareMuted}>share</Text>
              </View>
            </View>

            <View style={styles.headerBalanceSlot}>
              {showHeaderBalance ? (
                <View style={styles.balanceCard}>
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    style={[styles.balanceValue, { color: cfg.accent }]}
                  >
                    {launch.balanceLabel}
                  </Text>
                  <Text style={styles.balanceLabel}>Balance</Text>
                </View>
              ) : null}
            </View>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 16 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 340, delay: 80 }}
            style={styles.heroShell}
          >
            <LinearGradient
              colors={["#090D12", "#161B22", "#05070A"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.hero}
            >
              <View pointerEvents="none" style={styles.heroGlow} />
              <View style={styles.heroCopy}>
                <Text numberOfLines={1} adjustsFontSizeToFit style={styles.heroTitle}>
                  {launch.heroTitle}
                </Text>
                {launch.heroAccentTitle ? (
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    style={[styles.heroAccent, { color: cfg.accent }]}
                  >
                    {launch.heroAccentTitle}
                  </Text>
                ) : null}
                <View style={styles.heroRuleRow}>
                  <View style={styles.heroRule} />
                  <MaterialCommunityIcons name={FEATURE_ICONS.cards} size={18} color="#AEB8C7" />
                  <View style={styles.heroRule} />
                </View>
                <Text style={styles.heroDescription}>{launch.heroDescription}</Text>
              </View>

              <View style={styles.heroArtStage}>
                <GameArt kind={cfg.art} accent={cfg.accent} width={196} height={158} />
                <View style={styles.heroChip}>
                  <View style={styles.heroChipInner}>
                    <MaterialCommunityIcons name="cards-spade" size={29} color="#EEF6FF" />
                  </View>
                </View>
              </View>
            </LinearGradient>
          </MotiView>

          <View style={styles.rows}>
            {launch.rows.map((row, index) => (
              <RewardRow
                key={`${row.title}-${index}`}
                row={row}
                accent={cfg.accent}
                accentSoft={cfg.accentSoft}
              />
            ))}
          </View>

          {hasModeOptions ? (
            <View style={styles.modeSelector}>
              {modeOptions?.map((option) => {
                const active = option.id === selectedModeId;
                return (
                  <Pressable
                    key={option.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${option.label}. ${option.description}`}
                    accessibilityState={{ selected: active }}
                    onPress={() => onModeChange?.(option.id)}
                    style={({ pressed }) => [
                      styles.modeOption,
                      active && styles.modeOptionActive,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      style={[
                        styles.modeOptionLabel,
                        active && styles.modeOptionLabelActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                    <Text
                      numberOfLines={2}
                      style={[
                        styles.modeOptionDescription,
                        active && styles.modeOptionDescriptionActive,
                      ]}
                    >
                      {option.description}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          <View style={styles.primaryFrame}>
            <Pressable
              accessibilityRole="button"
              onPress={onPlay}
              style={({ pressed }) => [
                styles.primaryPressable,
                { backgroundColor: V2.blueDeep, shadowColor: cfg.accent },
                pressed && styles.pressed,
              ]}
            >
              <View
                pointerEvents="none"
                style={[styles.primaryContent, { backgroundColor: V2.blueDeep }]}
              >
                <View style={styles.primaryIconRing}>
                  <MaterialCommunityIcons name="cards-spade" size={19} color="#FFFFFF" />
                </View>
                <Text numberOfLines={1} adjustsFontSizeToFit style={styles.primaryText}>
                  {launch.primaryLabel}
                </Text>
              </View>
            </Pressable>
          </View>

          <View style={styles.bottomBreather} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function CircleButton({
  accessibilityLabel,
  icon,
  onPress,
}: {
  accessibilityLabel: string;
  icon: IonName;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [styles.circleButton, pressed && styles.pressed]}
    >
      <Ionicons name={icon} size={27} color={V2.ink} />
    </Pressable>
  );
}

function RewardRow({
  row,
  accent,
  accentSoft,
}: {
  row: GameLaunchRow;
  accent: string;
  accentSoft: string;
}) {
  return (
    <View style={styles.rewardRow}>
      <View style={styles.rewardMainLine}>
        <View style={[styles.rewardIcon, { backgroundColor: accentSoft }]}>
          <MaterialCommunityIcons name={FEATURE_ICONS[row.icon]} size={30} color={accent} />
        </View>

        <View style={styles.rewardCopy}>
          <View style={styles.rewardTitleLine}>
            <Text numberOfLines={1} adjustsFontSizeToFit style={styles.rewardTitle}>
              {row.title}
            </Text>
            {row.badge ? (
              <View style={[styles.rewardBadge, { backgroundColor: accentSoft }]}>
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  style={[styles.rewardBadgeText, { color: accent }]}
                >
                  {row.badge}
                </Text>
              </View>
            ) : null}
            {row.timer ? (
              <View style={styles.timerWrap}>
                <MaterialCommunityIcons name={FEATURE_ICONS.calendar} size={16} color={accent} />
                <Text numberOfLines={1} style={styles.timerText}>
                  {row.timer}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.rewardBodyLine}>
            <Text numberOfLines={2} style={styles.rewardBody}>
              {row.body}
              {row.accentText ? (
                <Text style={[styles.rewardBodyAccent, { color: accent }]}>
                  {" "}
                  {row.accentText}
                </Text>
              ) : null}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: GT.bg,
  },
  backdrop: {
    position: "absolute",
    top: -160,
    left: -110,
    width: 440,
    height: 440,
    borderRadius: 220,
    opacity: 0.7,
  },
  safe: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 2,
  },
  header: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerBackSlot: {
    width: 62,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  headerBalanceSlot: {
    width: 96,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
  },
  headerTitle: {
    ...typography.bold,
    maxWidth: "100%",
    fontSize: 29,
    lineHeight: 34,
    color: V2.ink,
    letterSpacing: 0,
    textAlign: "center",
    ...(Platform.OS === "android" ? { includeFontPadding: false } : {}),
  },
  circleButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: V2.hairline,
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  levelPill: {
    marginTop: 10,
    minHeight: 36,
    maxWidth: "100%",
    paddingLeft: 8,
    paddingRight: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.08)",
    backgroundColor: "rgba(255,255,255,0.78)",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  crownMark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F6D98A",
    alignItems: "center",
    justifyContent: "center",
  },
  levelText: {
    ...typography.bold,
    fontSize: 15,
    color: V2.ink,
    letterSpacing: 0,
  },
  levelDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CBD5E1",
  },
  shareText: {
    ...typography.bold,
    fontSize: 16,
    letterSpacing: 0,
  },
  shareMuted: {
    ...typography.regular,
    fontSize: 15,
    color: V2.muted,
    letterSpacing: 0,
  },
  balanceCard: {
    minWidth: 92,
    minHeight: 68,
    paddingHorizontal: 12,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: V2.hairline,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  balanceValue: {
    ...typography.bold,
    maxWidth: 78,
    fontSize: 25,
    lineHeight: 29,
    letterSpacing: 0,
    textAlign: "center",
    ...(Platform.OS === "android" ? { includeFontPadding: false } : {}),
  },
  balanceLabel: {
    marginTop: 3,
    fontSize: 13,
    color: V2.muted,
    letterSpacing: 0,
  },
  heroShell: {
    marginTop: 10,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOpacity: 0.2,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  hero: {
    minHeight: 218,
    borderRadius: 24,
    padding: 22,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
  },
  heroGlow: {
    position: "absolute",
    right: -82,
    top: 0,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "rgba(148,163,184,0.18)",
  },
  heroCopy: {
    flex: 1.15,
    minWidth: 0,
    zIndex: 2,
  },
  heroTitle: {
    ...typography.bold,
    maxWidth: "100%",
    fontSize: 36,
    lineHeight: 40,
    color: "#FFFFFF",
    letterSpacing: 0,
    ...(Platform.OS === "android" ? { includeFontPadding: false } : {}),
  },
  heroAccent: {
    ...typography.bold,
    maxWidth: "100%",
    marginTop: -2,
    fontSize: 42,
    lineHeight: 46,
    letterSpacing: 0,
    ...(Platform.OS === "android" ? { includeFontPadding: false } : {}),
  },
  heroRuleRow: {
    marginTop: 14,
    width: 168,
    maxWidth: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  heroRule: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.55)",
  },
  heroDescription: {
    ...typography.medium,
    marginTop: 14,
    fontSize: 16,
    lineHeight: 23,
    color: "#FFFFFF",
    letterSpacing: 0,
  },
  heroArtStage: {
    flex: 0.85,
    minWidth: 124,
    height: 170,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ translateX: 10 }],
  },
  heroChip: {
    position: "absolute",
    bottom: 22,
    left: 12,
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 6,
    borderColor: "#E5E7EB",
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.32,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  heroChipInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.34)",
    alignItems: "center",
    justifyContent: "center",
  },
  rows: {
    marginTop: 14,
    gap: 8,
  },
  modeSelector: {
    marginTop: 12,
    minHeight: 86,
    width: "100%",
    borderRadius: 34,
    padding: 6,
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.10)",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  modeOption: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    alignSelf: "stretch",
    minHeight: 74,
    borderRadius: 28,
    paddingHorizontal: 10,
    paddingVertical: 7,
    justifyContent: "center",
    alignItems: "center",
    outlineColor: "transparent",
    outlineStyle: "solid",
    outlineWidth: 0,
  },
  modeOptionActive: {
    backgroundColor: "#EEF1F6",
    shadowColor: "#000000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  modeOptionLabel: {
    ...typography.bold,
    maxWidth: "100%",
    fontSize: 17,
    lineHeight: 21,
    color: "#64748B",
    letterSpacing: 0,
    textAlign: "center",
  },
  modeOptionLabelActive: {
    color: V2.ink,
  },
  modeOptionDescription: {
    ...typography.semibold,
    marginTop: 3,
    maxWidth: "100%",
    fontSize: 11,
    lineHeight: 14,
    color: "#6B7280",
    letterSpacing: 0,
    textAlign: "center",
  },
  modeOptionDescriptionActive: {
    color: "#334155",
  },
  rewardRow: {
    minHeight: 82,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: V2.hairline,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  rewardMainLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rewardIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
  },
  rewardCopy: {
    flex: 1,
    minWidth: 0,
  },
  rewardTitleLine: {
    minHeight: 30,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rewardTitle: {
    ...typography.bold,
    flex: 1,
    minWidth: 0,
    fontSize: 19,
    lineHeight: 23,
    color: V2.ink,
    letterSpacing: 0,
    ...(Platform.OS === "android" ? { includeFontPadding: false } : {}),
  },
  rewardBadge: {
    maxWidth: 102,
    minHeight: 28,
    paddingHorizontal: 10,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  rewardBadgeText: {
    ...typography.bold,
    fontSize: 12,
    letterSpacing: 0,
  },
  timerWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  timerText: {
    ...typography.medium,
    fontSize: 13,
    color: "#475569",
    letterSpacing: 0,
  },
  rewardBodyLine: {
    marginTop: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  rewardBody: {
    ...typography.regular,
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    lineHeight: 22,
    color: "#475569",
    letterSpacing: 0,
  },
  rewardBodyAccent: {
    ...typography.medium,
  },
  primaryFrame: {
    marginTop: 10,
    borderRadius: 26,
    backgroundColor: "transparent",
  },
  primaryPressable: {
    minHeight: 60,
    borderRadius: 26,
    overflow: "hidden",
    shadowOpacity: 0.24,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  primaryContent: {
    minHeight: 60,
    paddingHorizontal: 18,
    borderRadius: 26,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  primaryIconRing: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.82)",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: {
    ...typography.bold,
    maxWidth: "72%",
    fontSize: 23,
    lineHeight: 27,
    color: "#FFFFFF",
    letterSpacing: 0,
    textAlign: "center",
    ...(Platform.OS === "android" ? { includeFontPadding: false } : {}),
  },
  bottomBreather: {
    height: 0,
  },
  pressed: {
    opacity: 0.82,
  },
});
