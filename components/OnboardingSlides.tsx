import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { MotiView } from "moti";
import React, { useCallback, useRef, useState } from "react";
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

import { GLASS } from "../constants/glassPalette";
import { markOnboarded } from "../constants/onboardingState";
import { typography } from "../constants/typography";
import { HeroGlassButton } from "./HeroGlassButton";
import { LiquidGlassChip } from "./LiquidGlassChip";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

interface Slide {
  id: string;
  headline: string;
  subtext: string;
  icon: IconName;
  accentColor: string;
  iconBgColor: string;
}

const SLIDES: Slide[] = [
  {
    id: "earn",
    headline: "Earn while\nyou play",
    subtext:
      "Play Games, Do Surveys, or Play Partner Games",
    icon: "gamepad-variant",
    accentColor: "#BAE6FD",
    iconBgColor: "#7DD3FC",
  },
  {
    id: "ads",
    headline: "Watch ads,\ncollect credits",
    subtext:
      "While playing, ads will automatically appear. We will share a portion of the ad revenue with you as credits you can redeem for cash.",
    icon: "play-circle",
    accentColor: "#CDEFD8",
    iconBgColor: "#9FE2B5",
  },
  {
    id: "cashout",
    headline: "Cash out\nanytime",
    subtext:
      "Trade credits for PayPal, gift cards, or crypto. No minimums, no waiting forever.",
    icon: "wallet-outline",
    accentColor: "#FFD7C2",
    iconBgColor: "#FFB389",
  },
  {
    id: "offers",
    headline: "Ready to Earn?",
    subtext:
      "Tip: Bigger Payouts come from Watching Ads!",
    icon: "trophy",
    accentColor: "#DED1FB",
    iconBgColor: "#BFA8F0",
  },
];

export function OnboardingSlides() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const listRef = useRef<FlatList<Slide>>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const isLast = activeIndex === SLIDES.length - 1;

  const goToIndex = useCallback(
    (idx: number) => {
      const clamped = Math.max(0, Math.min(SLIDES.length - 1, idx));
      listRef.current?.scrollToIndex({ index: clamped, animated: true });
      setActiveIndex(clamped);
    },
    [],
  );

  const handleFinish = useCallback(() => {
    markOnboarded();
    router.replace("/home-tab");
  }, [router]);

  const handlePrimary = useCallback(() => {
    if (isLast) {
      handleFinish();
    } else {
      goToIndex(activeIndex + 1);
    }
  }, [isLast, activeIndex, goToIndex, handleFinish]);

  const renderSlide = useCallback(
    ({ item }: ListRenderItemInfo<Slide>) => (
      <View style={{ width, flex: 1 }}>
        <SlideContent slide={item} />
      </View>
    ),
    [width],
  );

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right", "bottom"]}>
        <StatusBar style="dark" />

        {/* Skip — Liquid Glass chip-style button, sits top-right */}
        <View style={styles.skipRow}>
          <LiquidGlassChip
            systemImage="xmark"
            fallbackIcon="close"
            accessibilityLabel="Skip onboarding"
            size={36}
            iconColor="#000000"
            onPress={handleFinish}
          />
        </View>

        {/* Slides — horizontal pager driven by scrollToIndex (no swipe) */}
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

        {/* Pagination dots */}
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

        {/* Primary CTA — Liquid Glass pill, magnifies on press */}
        <View style={styles.ctaWrap}>
          <HeroGlassButton
            label={isLast ? "Get Started" : "Next"}
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

/**
 * Slide content. Plain `View`s — no `MotiView` wrappers — because the previous
 * version started at `from={{ opacity: 0 }}` and depended on Moti's entrance
 * animation to fade in. After the @expo/ui native rebuild the slide and icon
 * tile sometimes never animated past their initial 0-opacity state, leaving
 * the tutorial blank. Static rendering is robust and the screen still feels
 * lively because of the dot pager and CTA.
 */
function SlideContent({ slide }: { slide: Slide }) {
  return (
    <View style={styles.slide}>
      <View style={styles.illustrationSlot}>
        <View
          style={[
            styles.illustrationCard,
            { backgroundColor: slide.accentColor },
          ]}
        >
          <View
            style={[
              StyleSheet.absoluteFillObject,
              { backgroundColor: "rgba(255,255,255,0.6)" },
            ]}
            pointerEvents="none"
          />
          <View style={styles.illustrationGlow} pointerEvents="none" />
          <View
            style={[
              styles.illustrationIconTile,
              { backgroundColor: slide.iconBgColor },
            ]}
          >
            <MaterialCommunityIcons
              name={slide.icon}
              size={56}
              color="#000000"
            />
          </View>
        </View>
      </View>

      <View style={styles.textBlock}>
        <Text style={styles.headline}>{slide.headline}</Text>
        <Text style={styles.subtext}>{slide.subtext}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  skipRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  slidesContainer: {
    flex: 1,
  },
  slide: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    justifyContent: "flex-start",
  },
  illustrationSlot: {
    flexGrow: 0,
    flexShrink: 1,
    flexBasis: "38%",
    maxHeight: 260,
    minHeight: 160,
  },
  illustrationCard: {
    flex: 1,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: GLASS.charcoal,
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 7,
  },
  illustrationGlow: {
    position: "absolute",
    top: -28,
    right: -26,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.42)",
  },
  illustrationIconTile: {
    width: 112,
    height: 112,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: GLASS.charcoal,
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  textBlock: {
    flexGrow: 1,
    flexShrink: 0,
    minHeight: 0,
    paddingTop: 16,
    paddingHorizontal: 4,
  },
  headline: {
    ...typography.bold,
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -1.1,
    color: "#000000",
  },
  subtext: {
    ...typography.medium,
    marginTop: 14,
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: -0.15,
    color: GLASS.inkSoft,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingTop: 6,
    paddingBottom: 18,
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
