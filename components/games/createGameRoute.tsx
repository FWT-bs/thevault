import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getUnityGameId, isUnityGameEnabled } from "../../constants/featureFlags";
import { GAME_CONFIGS, GT } from "../../constants/gameTemplates";
import { V2 } from "../../constants/glassPalette";
import { typography } from "../../constants/typography";
import {
  useCompleteGameSession,
  useStartGameSession,
} from "../../services/features/gameplay";
import { GameLaunchPage } from "../v2/GameLaunchPage";
import { GameLoader } from "../v2/GameLoader";

export type GameModeOption<TModeId extends string = string> = {
  id: TModeId;
  label: string;
  description: string;
};

export type GameplayScreenProps<TModeId extends string = string> = {
  title: string;
  modeId: TModeId;
  modeLabel: string;
  accent: string;
  accentSoft: string;
  accentInk: string;
  onQuit: () => void;
  onFinish: (score: number) => void;
};

type ResultRenderProps = {
  title: string;
  score: number;
  rewardLabel: string;
  accent: string;
  onPlayAgain: () => void;
  onExit: () => void;
};

type CreateGameRouteOptions<TModeId extends string> = {
  gameId: string;
  modeOptions: ReadonlyArray<GameModeOption<TModeId>>;
  GameplayScreen: React.ComponentType<GameplayScreenProps<TModeId>>;
  /** Optional override for the post-round screen. Defaults to a built-in card. */
  ResultScreen?: React.ComponentType<ResultRenderProps>;
  /** Route to fall back to if there's nothing to pop to. Defaults to `/games-in-app`. */
  fallbackRoute?: string;
};

/**
 * Wires up the standard Vault game lifecycle (launch → loading → playing → result)
 * around a gameplay component, so a new game only needs to implement gameplay.
 *
 * Usage:
 *   const MyGame = createGameRoute({
 *     gameId: "my-game",
 *     modeOptions: [...],
 *     GameplayScreen: MyGameplay,
 *   });
 *   export default MyGame;
 */
export function createGameRoute<TModeId extends string>({
  gameId,
  modeOptions,
  GameplayScreen,
  ResultScreen = DefaultResultScreen,
  fallbackRoute = "/games-in-app",
}: CreateGameRouteOptions<TModeId>): React.ComponentType {
  if (!GAME_CONFIGS[gameId]) {
    throw new Error(
      `createGameRoute: no GAME_CONFIGS entry for "${gameId}". Add one in constants/gameTemplates.ts first.`,
    );
  }

  type Phase = "launch" | "loading" | "playing" | "result";

  function GameRoute() {
    const router = useRouter();
    const params = useLocalSearchParams<{ start?: string; mode?: TModeId }>();
    const cfg = GAME_CONFIGS[gameId];
    const startSession = useStartGameSession();
    const completeSession = useCompleteGameSession();

    const initialPhase: Phase =
      params.start === "playing" ? "playing" :
      params.start === "loading" ? "loading" : "launch";

    const [phase, setPhase] = useState<Phase>(initialPhase);
    const [modeId, setModeId] = useState<TModeId>(
      (params.mode as TModeId | undefined) ?? modeOptions[0].id,
    );
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [finalScore, setFinalScore] = useState(0);
    const [rewardLabel, setRewardLabel] = useState<string | null>(null);

    const mode = useMemo(
      () => modeOptions.find((m) => m.id === modeId) ?? modeOptions[0],
      [modeId],
    );

    const goBack = () => {
      if (router.canGoBack()) router.back();
      else router.replace(fallbackRoute as never);
    };

    const handlePlay = async () => {
      // If this game has a shippable Unity implementation enabled, route to
      // the fullscreen Unity host instead of the local launch→loading→playing
      // pipeline. UnityGameScreen starts its own backend session.
      if (isUnityGameEnabled(gameId)) {
        const unityGameId = getUnityGameId(gameId);
        if (unityGameId) {
          router.push({
            pathname: "/unity-game",
            params: { gameId: unityGameId, modeId },
          });
          return;
        }
      }

      try {
        const started = await startSession.mutateAsync({ gameId: cfg.id, modeId });
        setSessionId(started.session.id);
      } catch {
        setSessionId(null);
      } finally {
        setPhase("loading");
      }
    };

    const finishGame = async (score: number) => {
      setFinalScore(score);
      if (sessionId) {
        try {
          const completed = await completeSession.mutateAsync({ sessionId, score });
          setRewardLabel(`+${completed.result.rewardsCredits} CR`);
        } catch {
          setRewardLabel("Pending verification");
        }
      } else {
        setRewardLabel("Practice result");
      }
      setPhase("result");
    };

    if (phase === "launch") {
      return (
        <GameLaunchPage
          gameConfig={cfg}
          modeOptions={modeOptions as unknown as Array<{ id: string; label: string; description: string }>}
          selectedModeId={modeId}
          onModeChange={(id) => setModeId(id as TModeId)}
          onBack={goBack}
          onPlay={handlePlay}
        />
      );
    }

    if (phase === "loading") {
      return <GameLoader gameConfig={cfg} onReady={() => setPhase("playing")} />;
    }

    if (phase === "result") {
      return (
        <ResultScreen
          title={cfg.name}
          score={finalScore}
          rewardLabel={rewardLabel ?? "Pending"}
          accent={cfg.accent}
          onPlayAgain={() => {
            setSessionId(null);
            setRewardLabel(null);
            setFinalScore(0);
            setPhase("launch");
          }}
          onExit={goBack}
        />
      );
    }

    return (
      <GameplayScreen
        title={cfg.name}
        modeId={modeId}
        modeLabel={mode.label}
        accent={cfg.accent}
        accentSoft={cfg.accentSoft}
        accentInk={cfg.accentInk}
        onQuit={() => setPhase("launch")}
        onFinish={finishGame}
      />
    );
  }

  GameRoute.displayName = `GameRoute(${gameId})`;
  return GameRoute;
}

function DefaultResultScreen({
  title,
  score,
  rewardLabel,
  accent,
  onPlayAgain,
  onExit,
}: ResultRenderProps) {
  return (
    <View style={resultStyles.root}>
      <SafeAreaView style={resultStyles.safe} edges={["top", "bottom"]}>
        <View style={resultStyles.card}>
          <Text style={resultStyles.eyebrow}>{title}</Text>
          <Text style={resultStyles.title}>Round complete</Text>
          <Text style={[resultStyles.score, { color: accent }]}>{score}</Text>
          <Text style={resultStyles.reward}>{rewardLabel}</Text>

          <View style={resultStyles.actions}>
            <Pressable
              onPress={onPlayAgain}
              accessibilityRole="button"
              style={({ pressed }) => [
                resultStyles.primary,
                { backgroundColor: accent },
                pressed && { opacity: 0.85 },
              ]}
            >
              <Ionicons name="play" size={16} color="#FFFFFF" />
              <Text style={resultStyles.primaryText}>Play Again</Text>
            </Pressable>
            <Pressable
              onPress={onExit}
              accessibilityRole="button"
              style={({ pressed }) => [resultStyles.secondary, pressed && { opacity: 0.85 }]}
            >
              <Text style={resultStyles.secondaryText}>Exit</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const resultStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: GT.bg },
  safe: { flex: 1, padding: 24, alignItems: "center", justifyContent: "center" },
  card: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: V2.hairline,
    padding: 22,
    alignItems: "center",
  },
  eyebrow: {
    ...typography.bold,
    fontSize: 12,
    color: V2.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    ...typography.bold,
    marginTop: 8,
    fontSize: 28,
    color: V2.ink,
    textAlign: "center",
  },
  score: {
    ...typography.bold,
    marginTop: 12,
    fontSize: 54,
    fontVariant: ["tabular-nums"],
  },
  reward: { marginTop: 6, fontSize: 15, color: V2.muted },
  actions: { width: "100%", gap: 10, marginTop: 20 },
  primary: {
    minHeight: 52,
    borderRadius: 26,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryText: { ...typography.bold, color: "#FFFFFF", fontSize: 16 },
  secondary: {
    minHeight: 52,
    borderRadius: 26,
    backgroundColor: V2.cyanSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: { ...typography.bold, color: V2.cyanInk, fontSize: 16 },
});
