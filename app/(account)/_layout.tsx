import { Stack } from "expo-router";
import React from "react";

// Profile/account/settings sub-pages reached from the Profile and Home tabs.
export default function AccountLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: { backgroundColor: "#FFFFFF" },
      }}
    >
      <Stack.Screen name="vault-level" options={{ title: "Vault Level" }} />
    </Stack>
  );
}
