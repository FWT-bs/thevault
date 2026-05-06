import { Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

/**
 * Android / web: `@expo/ui/swift-ui` is iOS-only. See `swift-ui-demo.ios.tsx`.
 */
export default function SwiftUIDemoScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "SwiftUI", headerShown: true }} />
      <View style={styles.container}>
        <Text style={styles.title}>Expo UI (SwiftUI)</Text>
        <Text style={styles.body}>
          SwiftUI via @expo/ui runs on iOS only and is not available in Expo Go.
          Open this screen on an iOS dev build from{" "}
          <Text style={styles.mono}>npx expo run:ios</Text>.
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: "#444444",
  },
  mono: {
    fontFamily: "Menlo",
    fontSize: 14,
  },
});
