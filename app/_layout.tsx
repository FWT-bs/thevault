import { Stack } from "expo-router";
import React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { queryClient } from "../services/query/client";

import "../global.css";

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <Stack screenOptions={{ animation: "slide_from_right", contentStyle: { backgroundColor: "#FFFFFF" }, headerShown: false }}>
          <Stack.Screen
            name="index"
            options={{ headerShown: false, title: "Log in" }}
          />
          <Stack.Screen
            name="onboarding"
            options={{ headerShown: false, title: "Welcome", animation: "fade" }}
          />
          <Stack.Screen
            name="(tabs)"
            options={{ headerShown: false, title: "Main", animation: "fade" }}
          />
          <Stack.Screen
            name="redeem"
            options={{ headerShown: false, title: "Cash Out", animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="vault-level"
            options={{ headerShown: false, title: "Vault Level", animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="games-in-app"
            options={{ headerShown: false, title: "In App Games", animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="word-ladder"
            options={{ headerShown: false, title: "Word Ladder", animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="blackjack"
            options={{ headerShown: false, title: "Blackjack", animation: "fade" }}
          />
          <Stack.Screen
            name="block-blast"
            options={{ headerShown: false, title: "Block Blast", animation: "fade" }}
          />
          <Stack.Screen
            name="bricks-vs-balls"
            options={{ headerShown: false, title: "Bricks vs Balls", animation: "fade" }}
          />
          <Stack.Screen
            name="color-stack"
            options={{ headerShown: false, title: "Color Stack", animation: "fade" }}
          />
          <Stack.Screen
            name="game-template"
            options={{ headerShown: false, title: "In-App Game", animation: "fade" }}
          />
          <Stack.Screen
            name="streak-claim"
            options={{
              headerShown: false,
              title: "Daily Streak",
              animation: "slide_from_bottom",
              presentation: "fullScreenModal",
              contentStyle: { backgroundColor: "#0A0A0C" },
            }}
          />
          <Stack.Screen
            name="games-external"
            options={{ headerShown: false, title: "External Games", animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="offerwall"
            options={{ headerShown: false, title: "Offerwall", animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="swift-ui-demo"
            options={{ animation: "slide_from_right", title: "SwiftUI", headerShown: true }}
          />
        </Stack>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
