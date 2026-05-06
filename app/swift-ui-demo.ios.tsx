import { Stack, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { SFSymbol } from "sf-symbols-typescript";
import {
  Button,
  GlassEffectContainer,
  HStack,
  Host,
  Image,
  Spacer,
  Text,
  VStack,
} from "@expo/ui/swift-ui";
import {
  buttonStyle,
  clipShape,
  foregroundStyle,
  frame,
  glassEffect,
  padding,
} from "@expo/ui/swift-ui/modifiers";

import {
  LIQUID_GLASS_SHOWCASE_BUTTON_HEIGHT_PT,
  LIQUID_GLASS_SHOWCASE_BUTTON_LABEL_COLOR,
} from "../constants/liquidGlassShowcaseButton";
import { LiquidGlassButton } from "../components/LiquidGlassButton";
import { liquidGlassControlHeightPt } from "../constants/liquidGlassLayout";
import { GLASS } from "../constants/glassPalette";

/**
 * iOS 26 Liquid Glass showcase — pure SwiftUI via @expo/ui.
 *
 * `@expo/ui@0.2.0-beta.9` does not ship a `font()` modifier; use `Text` /
 * `Image` props (`size`, `weight`, `color`) instead.
 *
 * Requires a dev build with deployment target 26.0+. Will not render in Expo Go.
 */
export default function SwiftUIDemoScreen() {
  const router = useRouter();
  return (
    <>
      <Stack.Screen
        options={{
          title: "Liquid Glass",
          headerShown: true,
          headerLeft: () => (
            <LiquidGlassButton
              label="Profile"
              systemImage="chevron.backward"
              size="compact"
              tone="neutral"
              variant="glassProminent"
              onPress={() => {
                if (router.canGoBack()) router.back();
                else router.replace("/profile-tab");
              }}
            />
          ),
        }}
      />

      <View style={styles.root}>
        <LinearGradient
          colors={[GLASS.canvas, GLASS.canvasDeep, GLASS.cobaltLight]}
          locations={[0, 0.55, 1]}
          style={StyleSheet.absoluteFillObject}
        />

        <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
          <Host style={styles.host}>
            <VStack spacing={20}>
              <GlassEffectContainer spacing={8}>
                <HStack spacing={8}>
                  <ResourcePill systemImage="heart.fill" value="5" label="Lives" tintHex={GLASS.oxblood} />
                  <ResourcePill systemImage="bolt.fill" value="240" label="Coins" tintHex={GLASS.copper} />
                  <ResourcePill systemImage="flame.fill" value="12" label="Streak" tintHex={GLASS.mustardDeep} />
                </HStack>
              </GlassEffectContainer>

              <VStack
                alignment="leading"
                spacing={10}
                modifiers={[
                  glassEffect({
                    glass: { variant: "regular", interactive: true },
                    shape: "rectangle",
                  }),
                  clipShape("roundedRectangle", 28),
                  padding({ all: 22 }),
                ]}
              >
                <HStack spacing={8}>
                  <Image systemName="sparkles" size={14} color={GLASS.cobaltDeep} />
                  <Text size={11} weight="bold" color={GLASS.cobaltDeep}>
                    DAILY VAULT
                  </Text>
                </HStack>

                <Text size={30} weight="heavy" color={GLASS.ink}>
                  Liquid Glass is live
                </Text>

                <Text
                  size={14}
                  weight="regular"
                  modifiers={[
                    foregroundStyle({
                      type: "hierarchical",
                      style: "secondary",
                    }),
                  ]}
                >
                  Tap a button — the surface refracts the canvas behind it. This card uses the
                  iOS 26 glassEffect modifier, not a BlurView approximation.
                </Text>

                <Spacer />

                <HStack spacing={10}>
                  <Button
                    color={LIQUID_GLASS_SHOWCASE_BUTTON_LABEL_COLOR}
                    systemImage="play.fill"
                    onPress={() => console.log("[liquid-glass] Play pressed")}
                    modifiers={[
                      frame({
                        minHeight: LIQUID_GLASS_SHOWCASE_BUTTON_HEIGHT_PT,
                        maxHeight: LIQUID_GLASS_SHOWCASE_BUTTON_HEIGHT_PT,
                      }),
                      buttonStyle("glassProminent"),
                    ]}
                  >
                    Play
                  </Button>
                  <Button
                    color={LIQUID_GLASS_SHOWCASE_BUTTON_LABEL_COLOR}
                    systemImage="trophy.fill"
                    onPress={() => console.log("[liquid-glass] Leaderboard pressed")}
                    modifiers={[
                      frame({
                        minHeight: LIQUID_GLASS_SHOWCASE_BUTTON_HEIGHT_PT,
                        maxHeight: LIQUID_GLASS_SHOWCASE_BUTTON_HEIGHT_PT,
                      }),
                      buttonStyle("glass"),
                    ]}
                  >
                    Leaderboard
                  </Button>
                </HStack>
              </VStack>

              <VStack
                alignment="leading"
                spacing={6}
                modifiers={[
                  glassEffect({
                    glass: {
                      variant: "regular",
                      interactive: true,
                      tint: GLASS.copper,
                    },
                    shape: "rectangle",
                  }),
                  clipShape("roundedRectangle", 24),
                  padding({ all: 18 }),
                ]}
              >
                <Text size={11} weight="bold" color="#FFFFFF">
                  COPPER ACCENT
                </Text>
                <Text size={18} weight="bold" color="#FFFFFF">
                  Tinted Liquid Glass
                </Text>
                <Text size={13} weight="regular" color="rgba(255,255,255,0.86)">
                  Same glassEffect modifier with tint — refraction stays, hue warms.
                </Text>
              </VStack>

              <Spacer />
            </VStack>
          </Host>
        </SafeAreaView>
      </View>
    </>
  );
}

interface ResourcePillProps {
  systemImage: SFSymbol;
  value: string;
  label: string;
  tintHex: string;
}

function ResourcePill({ systemImage, value, label, tintHex }: ResourcePillProps) {
  const valueSize = 9;
  const pillHeight = liquidGlassControlHeightPt(valueSize);
  return (
    <HStack
      spacing={6}
      modifiers={[
        glassEffect({
          glass: { variant: "regular", interactive: true },
          shape: "capsule",
        }),
        padding({ horizontal: 10, vertical: 6 }),
        frame({ minHeight: pillHeight, maxHeight: pillHeight }),
      ]}
    >
      <Image systemName={systemImage} size={9} color={tintHex} />
      <Text size={valueSize} weight="bold" color="#000000">
        {value}
      </Text>
      <Text
        size={8}
        weight="semibold"
        modifiers={[foregroundStyle({ type: "hierarchical", style: "secondary" })]}
      >
        {label}
      </Text>
    </HStack>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: GLASS.canvas,
  },
  safeArea: {
    flex: 1,
  },
  host: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
});
