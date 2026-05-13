import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { queryClient } from "../services/query/client";
import { SessionProvider, useSession } from "../services/auth/SessionProvider";

import "../global.css";

const PUBLIC_ROUTES = new Set(["index", "verify"]);

function AuthRouter({ children }: { children: React.ReactNode }) {
  const { session, isReady, hasOnboarded } = useSession();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (!isReady) return;
    const root = (segments[0] as string | undefined) ?? "index";
    const inAuthFlow = PUBLIC_ROUTES.has(root);

    if (!session && !inAuthFlow) {
      router.replace("/");
      return;
    }

    if (session && root === "index") {
      router.replace(hasOnboarded ? "/home-tab" : "/onboarding");
      return;
    }
  }, [isReady, session, hasOnboarded, segments, router]);

  if (!isReady) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#FFFFFF",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="small" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <SafeAreaProvider>
          <AuthRouter>
            <Stack
              screenOptions={{
                animation: "slide_from_right",
                contentStyle: { backgroundColor: "#FFFFFF" },
                headerShown: false,
              }}
            >
              <Stack.Screen name="index" options={{ title: "Log in" }} />
              <Stack.Screen name="verify" options={{ title: "Verify" }} />
              <Stack.Screen name="onboarding" options={{ animation: "fade", title: "Welcome" }} />
              <Stack.Screen name="(tabs)" options={{ animation: "fade", title: "Main" }} />
              <Stack.Screen name="(games)" />
              <Stack.Screen name="(account)" />
              <Stack.Screen name="(wallet)" />
              <Stack.Screen
                name="(modals)"
                options={{
                  presentation: "fullScreenModal",
                  animation: "slide_from_bottom",
                  contentStyle: { backgroundColor: "#0A0A0C" },
                }}
              />
              <Stack.Screen name="swift-ui-demo" options={{ title: "SwiftUI", headerShown: true }} />
            </Stack>
          </AuthRouter>
        </SafeAreaProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
