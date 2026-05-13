import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import TabScreen from "./TabScreen";
import { GLASS, V2 } from "../constants/glassPalette";
import { typography } from "../constants/typography";

export function SubPage({
  title,
  subtitle,
  children,
  backTo,
  backLabel = "Profile",
  backgroundColor = V2.bg,
  contentContainerStyle,
  headerAccessory,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  backTo?: string;
  backLabel?: string;
  backgroundColor?: string;
  contentContainerStyle?: StyleProp<ViewStyle>;
  headerAccessory?: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          title,
        }}
      />
      <TabScreen
        title={title}
        subtitle={subtitle}
        backgroundColor={backgroundColor}
        titleColor={GLASS.ink}
        subtitleColor={GLASS.inkMuted}
        contentContainerStyle={contentContainerStyle}
        headerLeading={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Back to ${backLabel}`}
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.replace((backTo ?? "/profile-tab") as never);
            }}
            style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.72 }]}
            hitSlop={8}
          >
            <Ionicons name="chevron-back" size={20} color="#000000" />
          </Pressable>
        }
        headerAccessory={headerAccessory}
      >
        {children}
      </TabScreen>
    </>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function SettingsRow({
  icon,
  iconBg,
  iconTint,
  label,
  detail,
  onPress,
  isLast,
  danger,
  rightSlot,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  iconBg: string;
  iconTint: string;
  label: string;
  detail?: string;
  onPress?: () => void;
  isLast?: boolean;
  danger?: boolean;
  rightSlot?: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !isLast && styles.rowBorder,
        pressed && onPress ? { opacity: 0.78 } : null,
      ]}
    >
      <View pointerEvents="none" style={styles.rowContent}>
        <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>
          <Ionicons name={icon} size={16} color={iconTint} />
        </View>
        <Text
          style={[
            styles.rowLabel,
            danger && { color: GLASS.oxblood },
          ]}
        >
          {label}
        </Text>
        {detail ? <Text style={styles.rowDetail}>{detail}</Text> : null}
        {rightSlot ? rightSlot : null}
        {!danger && !rightSlot ? (
          <Ionicons name="chevron-forward" size={16} color={GLASS.inkFaint} />
        ) : null}
      </View>
    </Pressable>
  );
}

export function CardSurface({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.cardSurface, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    shadowColor: "#000000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  sectionTitle: {
    ...typography.bold,
    marginTop: 18,
    marginBottom: 10,
    marginLeft: 6,
    fontSize: 11,
    color: "#000000",
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  cardSurface: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "#FFFFFF",
    padding: 6,
  },
  row: {
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  rowContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  rowLabel: {
    ...typography.semibold,
    flex: 1,
    fontSize: 15,
    color: GLASS.ink,
    letterSpacing: -0.2,
  },
  rowDetail: {
    ...typography.semibold,
    marginRight: 8,
    fontSize: 12,
    color: GLASS.inkMuted,
  },
});
