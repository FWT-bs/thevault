import UnityView from "@azesmway/react-native-unity";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import {
  UnityGameIdSchema,
  type UnityGameId,
  type UnityMessage,
} from "@thevault/contracts";

import {
  isUnityAvailable,
  parseUnityMessage,
  sendUnityConfig,
  sendUnityExit,
  type UnityNativeEvent,
  type UnityViewHandle,
} from "../../services/unityBridge";
import { useSession } from "../../services/auth/SessionProvider";
import {
  useCompleteGameSession,
  useStartGameSession,
} from "../../services/features/gameplay";

type Phase = "starting" | "loading" | "playing" | "submitting" | "finished" | "error";

type FinalState = {
  score: number;
  won: boolean;
  rewardsCredits: number;
};

export default function UnityGameScreen() {
  const params = useLocalSearchParams<{
    gameId?: string;
    modeId?: string;
    difficulty?: "easy" | "normal" | "hard";
  }>();

  const router = useRouter();
  const { session } = useSession();

  const unityRef = useRef<UnityViewHandle | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const finishedRef = useRef(false);

  const [phase, setPhase] = useState<Phase>("starting");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [finalState, setFinalState] = useState<FinalState | null>(null);

  const startSession = useStartGameSession();
  const completeSession = useCompleteGameSession();

  // Parse + validate route params once.
  type LaunchInfo =
    | { ok: true; gameId: UnityGameId; modeId: string; difficulty: "easy" | "normal" | "hard" }
    | { ok: false; error: string };

  const launchInfo = useMemo<LaunchInfo>(() => {
    const gameIdResult = UnityGameIdSchema.safeParse(params.gameId);
    if (!gameIdResult.success) {
      return { ok: false, error: `Unknown gameId "${params.gameId ?? ""}"` };
    }
    return {
      ok: true,
      gameId: gameIdResult.data,
      modeId: (params.modeId ?? "classic").toString(),
      difficulty: params.difficulty ?? "normal",
    };
  }, [params.gameId, params.modeId, params.difficulty]);

  // 1) On mount: ask the backend for a sessionId.
  useEffect(() => {
    if (!launchInfo.ok) {
      setPhase("error");
      setErrorMessage(launchInfo.error);
      return;
    }
    if (!isUnityAvailable()) {
      setPhase("error");
      setErrorMessage(
        Platform.OS === "web"
          ? "Unity mini-games are not supported on web."
          : "Unity native module unavailable. Use a custom dev client (expo-dev-client) — Expo Go cannot load Unity.",
      );
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const { session: gameSession } = await startSession.mutateAsync({
          gameId: launchInfo.gameId,
          modeId: launchInfo.modeId,
        });
        if (cancelled) return;
        sessionIdRef.current = gameSession.id;
        setPhase("loading");
      } catch (e) {
        if (cancelled) return;
        setPhase("error");
        setErrorMessage((e as Error).message ?? "Failed to start session");
      }
    })();

    return () => {
      cancelled = true;
    };
    // launchInfo is stable per param change; intentionally not depending on
    // the mutation object identity to avoid re-firing on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [launchInfo]);

  // 2) Once we have a sessionId AND the UnityView ref, push the config.
  const handleViewRef = useCallback(
    (ref: UnityViewHandle | null) => {
      unityRef.current = ref;
      maybeSendConfig();
    },
    // maybeSendConfig is defined below in scope; safe — refs only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const maybeSendConfig = useCallback(() => {
    if (!launchInfo.ok) return;
    if (!unityRef.current || !sessionIdRef.current) return;
    const userId = session?.user?.id;
    if (!userId) {
      setPhase("error");
      setErrorMessage("Not signed in");
      return;
    }
    sendUnityConfig(unityRef.current, {
      gameId: launchInfo.gameId,
      sessionId: sessionIdRef.current,
      userId,
      difficulty: launchInfo.difficulty,
      seed: Math.floor(Math.random() * 0x7fffffff),
      settings: {},
    });
  }, [launchInfo, session?.user?.id]);

  // Re-send config when the session id arrives after the ref.
  useEffect(() => {
    if (phase === "loading") maybeSendConfig();
  }, [phase, maybeSendConfig]);

  // 3) Inbound Unity messages.
  const handleUnityMessage = useCallback(
    (event: UnityNativeEvent) => {
      const parsed = parseUnityMessage(event);
      if (!parsed.ok) {
        // Unknown payloads (e.g. dev probes from Unity-side debug code) are
        // logged but never crash gameplay.
        if (__DEV__) {
          console.warn("[UnityGameScreen] unparseable message", parsed.error, parsed.raw);
        }
        return;
      }
      onUnityMessage(parsed.message);
    },
    // onUnityMessage is closed over below; safe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const onUnityMessage = useCallback(
    async (msg: UnityMessage) => {
      switch (msg.type) {
        case "GAME_READY":
          setPhase("playing");
          return;

        case "GAME_EXITED":
          if (!finishedRef.current) router.back();
          return;

        case "GAME_ERROR":
          setPhase("error");
          setErrorMessage(`${msg.code}: ${msg.message}`);
          return;

        case "GAME_FINISHED": {
          if (finishedRef.current) return; // idempotent: ignore duplicates
          finishedRef.current = true;
          setPhase("submitting");
          try {
            const { result } = await completeSession.mutateAsync({
              sessionId: msg.sessionId,
              score: msg.score,
              gameId: msg.gameId,
              durationMs: msg.durationMs,
            });
            setFinalState({
              score: msg.score,
              won: msg.won,
              rewardsCredits: result.rewardsCredits,
            });
            setPhase("finished");
          } catch (e) {
            setPhase("error");
            setErrorMessage((e as Error).message ?? "Failed to submit score");
          }
          return;
        }
      }
    },
    [completeSession, router],
  );

  // 4) Player tapped Exit in the header.
  const handleExit = useCallback(() => {
    if (phase === "playing" || phase === "loading") {
      Alert.alert(
        "Exit game?",
        "You will lose progress in this round.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Exit",
            style: "destructive",
            onPress: () => {
              if (sessionIdRef.current && unityRef.current) {
                sendUnityExit(unityRef.current, sessionIdRef.current);
              }
              router.back();
            },
          },
        ],
        { cancelable: true },
      );
      return;
    }
    router.back();
  }, [phase, router]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  if (!launchInfo.ok || phase === "error") {
    return (
      <View style={styles.fill}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.centerCard}>
          <Text style={styles.errorTitle}>Couldn’t start game</Text>
          <Text style={styles.errorBody}>
            {!launchInfo.ok ? launchInfo.error : errorMessage}
          </Text>
          <Pressable style={styles.primaryButton} onPress={() => router.back()}>
            <Text style={styles.primaryButtonText}>Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.fill}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Always mount UnityView fullscreen behind any overlay. */}
      <UnityView
        ref={handleViewRef as unknown as React.Ref<UnityView>}
        fullScreen
        style={StyleSheet.absoluteFillObject}
        onUnityMessage={handleUnityMessage}
      />

      {/* Loading veil until Unity replies GAME_READY. */}
      {(phase === "starting" || phase === "loading") && (
        <View style={styles.veil}>
          <ActivityIndicator color="#FFFFFF" size="large" />
          <Text style={styles.veilText}>
            {phase === "starting" ? "Starting session…" : "Loading game…"}
          </Text>
        </View>
      )}

      {/* Submitting veil while we POST /gameplay/complete. */}
      {phase === "submitting" && (
        <View style={styles.veil}>
          <ActivityIndicator color="#FFFFFF" size="large" />
          <Text style={styles.veilText}>Submitting score…</Text>
        </View>
      )}

      {/* Finished overlay. Reward is taken from the backend response, never
          from the Unity-reported value. */}
      {phase === "finished" && finalState && (
        <View style={styles.veil}>
          <View style={styles.centerCard}>
            <Text style={styles.finishedTitle}>
              {finalState.won ? "Nice run!" : "Round over"}
            </Text>
            <Text style={styles.scoreLabel}>Score</Text>
            <Text style={styles.score}>{finalState.score.toLocaleString()}</Text>
            <Text style={styles.rewardLabel}>Reward</Text>
            <Text style={styles.reward}>+{finalState.rewardsCredits} CR</Text>
            <Pressable style={styles.primaryButton} onPress={() => router.back()}>
              <Text style={styles.primaryButtonText}>Done</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Floating exit button. */}
      <View style={styles.exitWrap} pointerEvents="box-none">
        <Pressable onPress={handleExit} style={styles.exitButton} hitSlop={12}>
          <Text style={styles.exitText}>Exit</Text>
        </Pressable>
      </View>
    </View>
  );
}

// Route guard: anybody accessing /unity-game without a valid gameId param
// gets the error card above, not a blank Unity view.
export const unstable_settings = {
  initialRouteName: "unity-game",
};

// ---------------------------------------------------------------------------
// Styles — kept minimal; relies on the system safe-area providers used by
// the rest of the app. Colors pulled from constants/appPalette would be nicer
// long-term; using literal tokens here so the screen renders before Phase 2.
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "#000" },
  veil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.85)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  veilText: { marginTop: 16, color: "#fff", fontSize: 16, fontWeight: "600" },
  centerCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#101010",
    borderRadius: 18,
    padding: 24,
    alignItems: "center",
  },
  finishedTitle: { fontSize: 22, fontWeight: "800", color: "#fff", marginBottom: 18 },
  scoreLabel: { color: "#9aa", fontSize: 12, letterSpacing: 1, marginTop: 8 },
  score: { color: "#fff", fontSize: 36, fontWeight: "800" },
  rewardLabel: { color: "#9aa", fontSize: 12, letterSpacing: 1, marginTop: 16 },
  reward: { color: "#FFD166", fontSize: 28, fontWeight: "800" },
  primaryButton: {
    marginTop: 24,
    paddingVertical: 14,
    paddingHorizontal: 32,
    backgroundColor: "#FFD166",
    borderRadius: 12,
  },
  primaryButtonText: { color: "#000", fontSize: 16, fontWeight: "800" },
  errorTitle: { color: "#fff", fontSize: 20, fontWeight: "800", marginBottom: 12 },
  errorBody: { color: "#bbb", textAlign: "center", marginBottom: 16 },
  exitWrap: {
    position: "absolute",
    top: 48,
    right: 16,
  },
  exitButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 999,
  },
  exitText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});
