import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MotiView } from "moti";

import { GameLaunchPage } from "../../v2/GameLaunchPage";
import { GameLoader } from "../../v2/GameLoader";
import { GAME_CONFIGS, GT } from "../../../constants/gameTemplates";

type Stage = "launch" | "loading";

const GAME_IDS = Object.keys(GAME_CONFIGS);

// Preview host for the generic in-app game template. Real games with gameplay
// should use a thin route and move implementation under `components/games/`.
export default function GameTemplateRoute() {
  const router = useRouter();
  const [gameId, setGameId] = useState<string>(GAME_IDS[0]);
  const [stage, setStage] = useState<Stage>("launch");
  const cfg = GAME_CONFIGS[gameId];

  const switchGame = (id: string) => {
    setGameId(id);
    setStage("launch");
  };

  const finishLoading = () => {
    if (cfg.id === "blackjack") {
      router.push("/blackjack?start=playing");
      return;
    }

    console.log("[game-template] loaded", cfg.id);
    setStage("launch");
  };

  return (
    <View style={{ flex: 1, backgroundColor: GT.bg }}>
      <View style={{ flex: 1 }}>
        {stage === "launch" ? (
          <MotiView
            key={`launch-${gameId}`}
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: "timing", duration: 200 }}
            style={StyleSheet.absoluteFill}
          >
            <GameLaunchPage
              gameConfig={cfg}
              onBack={() => {
                if (router.canGoBack()) router.back();
                else router.replace("/games-in-app");
              }}
              onPlay={() => setStage("loading")}
            />
          </MotiView>
        ) : (
          <MotiView
            key={`loader-${gameId}`}
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: "timing", duration: 200 }}
            style={StyleSheet.absoluteFill}
          >
            <GameLoader gameConfig={cfg} onReady={finishLoading} />
          </MotiView>
        )}
      </View>

      <SafeAreaView edges={["top"]} pointerEvents="box-none" style={styles.switcherWrap}>
        <View style={styles.switcher}>
          {Object.values(GAME_CONFIGS).map((g) => {
            const active = g.id === gameId;
            return (
              <Pressable
                key={g.id}
                onPress={() => switchGame(g.id)}
                style={({ pressed }) => [
                  styles.switcherBtn,
                  active && styles.switcherBtnActive,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Text style={[styles.switcherText, active && styles.switcherTextActive]}>
                  {g.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  switcherWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  switcher: {
    marginTop: 6,
    flexDirection: "row",
    gap: 6,
    padding: 6,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.08)",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  switcherBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9,
    backgroundColor: "transparent",
  },
  switcherBtnActive: { backgroundColor: "#0A0A0A" },
  switcherText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0A0A0A",
    letterSpacing: -0.1,
  },
  switcherTextActive: { color: "#FFFFFF" },
});
