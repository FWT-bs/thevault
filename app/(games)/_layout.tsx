import { Stack } from "expo-router";
import React from "react";

// All game-related routes (game library, gameplay, partner games, offerwall).
// URLs are unchanged: `/blackjack`, `/games-in-app`, etc.
export default function GamesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade",
        contentStyle: { backgroundColor: "#FFFFFF" },
      }}
    >
      <Stack.Screen name="games-in-app" options={{ animation: "slide_from_right", title: "In App Games" }} />
      <Stack.Screen name="games-external" options={{ animation: "slide_from_right", title: "External Games" }} />
      <Stack.Screen name="offerwall" options={{ animation: "slide_from_right", title: "Offerwall" }} />
      <Stack.Screen name="word-ladder" options={{ animation: "slide_from_right", title: "Word Ladder" }} />
      <Stack.Screen name="blackjack" options={{ title: "Blackjack" }} />
      <Stack.Screen name="block-blast" options={{ title: "Block Blast" }} />
      <Stack.Screen name="bricks-vs-balls" options={{ title: "Bricks vs Balls" }} />
      <Stack.Screen name="color-stack" options={{ title: "Color Stack" }} />
      <Stack.Screen name="jigsaw-puzzle" options={{ title: "Jigsaw Puzzle" }} />
      <Stack.Screen name="high-low" options={{ title: "High Low" }} />
      <Stack.Screen name="single-line" options={{ title: "Single Line" }} />
      <Stack.Screen name="water-sorter" options={{ title: "Water Sorter" }} />
      <Stack.Screen name="plinko" options={{ title: "Plinko" }} />
      <Stack.Screen name="coloring" options={{ title: "Coloring" }} />
      <Stack.Screen name="fruit-merge" options={{ title: "Fruit Merge" }} />
      <Stack.Screen name="game-template" options={{ title: "In-App Game" }} />
    </Stack>
  );
}
