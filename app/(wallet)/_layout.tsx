import { Stack } from "expo-router";
import React from "react";

// Wallet sub-pages reached from the Wallet tab.
export default function WalletLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: { backgroundColor: "#FFFFFF" },
      }}
    >
      <Stack.Screen name="redeem" options={{ title: "Cash Out" }} />
    </Stack>
  );
}
