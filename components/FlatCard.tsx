import React from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

type FlatCardProps = {
  children?: React.ReactNode;
  radius?: number;
  pad?: number;
  style?: StyleProp<ViewStyle>;
};

export function FlatCard({ children, radius = 22, pad = 18, style }: FlatCardProps) {
  return (
    <View style={[styles.base, { borderRadius: radius, padding: pad }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.06)",
    shadowColor: "#000000",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
});
