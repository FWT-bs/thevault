import { StyleSheet } from "react-native";

import { COOLORS } from "./coolors";

/**
 * RN StyleSheet colors — bypass NativeWind merge issues on iOS where
 * `className` color utilities can fail to apply or get overridden.
 */
export const paletteStyles = StyleSheet.create({
  inkText: { color: COOLORS.ink },
});
