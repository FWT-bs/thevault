import { Stack } from "expo-router";
import React from "react";

// Modal-style screens presented over the app (full-screen modal presentations).
export default function ModalsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: "fullScreenModal",
        animation: "slide_from_bottom",
        contentStyle: { backgroundColor: "#0A0A0C" },
      }}
    >
      <Stack.Screen name="streak-claim" options={{ title: "Daily Streak" }} />
    </Stack>
  );
}
