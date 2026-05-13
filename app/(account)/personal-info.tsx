import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { LiquidGlassButton } from "../../components/LiquidGlassButton";
import { CardSurface, SectionTitle, SubPage } from "../../components/SubPage";
import { GLASS } from "../../constants/glassPalette";
import { typography } from "../../constants/typography";
import { useMe } from "../../services/features/auth";

interface Field {
  key: string;
  label: string;
  initial: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  keyboard?: "default" | "email-address" | "phone-pad";
}

const FIELDS: Omit<Field, "initial">[] = [
  { key: "name", label: "Display name", icon: "person-outline" },
  { key: "email", label: "Email", icon: "mail-outline", keyboard: "email-address" },
  { key: "phone", label: "Phone", icon: "call-outline", keyboard: "phone-pad" },
  { key: "birthday", label: "Birthday", icon: "calendar-outline" },
  { key: "country", label: "Country", icon: "earth-outline" },
];

export default function PersonalInfoPage() {
  const { data: me } = useMe();
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(FIELDS.map((f) => [f.key, "Not added"])),
  );
  const [editing, setEditing] = useState<string | null>(null);

  useEffect(() => {
    setValues((prev) => ({
      ...prev,
      name: me?.displayName ?? prev.name,
      email: me?.email ?? "Not added",
      phone: me?.phone ?? "Not added",
    }));
  }, [me]);

  return (
    <SubPage
      title="Personal info"
      subtitle="What we use to verify and pay you out"
      backTo="/profile-tab"
    >
      <SectionTitle>Profile</SectionTitle>
      <CardSurface>
        {FIELDS.map((field, i) => {
          const isLast = i === FIELDS.length - 1;
          const isEditing = editing === field.key;
          return (
            <View
              key={field.key}
              style={[styles.row, !isLast && styles.rowBorder]}
            >
              <View style={styles.rowIcon}>
                <Ionicons name={field.icon} size={16} color={GLASS.steelDeep} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>{field.label}</Text>
                {isEditing ? (
                  <TextInput
                    value={values[field.key]}
                    onChangeText={(text) =>
                      setValues((prev) => ({ ...prev, [field.key]: text }))
                    }
                    keyboardType={field.keyboard ?? "default"}
                    style={styles.input}
                    autoFocus
                    onBlur={() => setEditing(null)}
                  />
                ) : (
                  <Text style={styles.value}>{values[field.key]}</Text>
                )}
              </View>
              <Pressable
                onPress={() => setEditing(isEditing ? null : field.key)}
                hitSlop={8}
              >
                <Ionicons
                  name={isEditing ? "checkmark" : "pencil"}
                  size={16}
                  color={GLASS.inkMuted}
                />
              </Pressable>
            </View>
          );
        })}
      </CardSurface>

      <SectionTitle>Address</SectionTitle>
      <CardSurface>
        <View style={[styles.row, styles.rowBorder]}>
          <View style={styles.rowIcon}>
            <Ionicons name="home-outline" size={16} color={GLASS.steelDeep} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Street</Text>
            <Text style={styles.value}>Not added</Text>
          </View>
          <Ionicons name="pencil" size={16} color={GLASS.inkMuted} />
        </View>
        <View style={styles.row}>
          <View style={styles.rowIcon}>
            <Ionicons name="map-outline" size={16} color={GLASS.steelDeep} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>City / Postal</Text>
            <Text style={styles.value}>Not added</Text>
          </View>
          <Ionicons name="pencil" size={16} color={GLASS.inkMuted} />
        </View>
      </CardSurface>

      <View style={{ height: 18 }} />
      <LiquidGlassButton
        label="Save changes"
        systemImage="square.and.arrow.down"
        size="small"
        tone="cobalt"
        variant="glassProminent"
        fullWidth
      />
    </SubPage>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(56,189,248,0.14)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  label: {
    ...typography.semibold,
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: GLASS.inkMuted,
  },
  value: {
    ...typography.semibold,
    marginTop: 2,
    fontSize: 14,
    color: GLASS.ink,
    letterSpacing: -0.2,
  },
  input: {
    ...typography.semibold,
    marginTop: 2,
    paddingVertical: 0,
    fontSize: 14,
    color: GLASS.ink,
    letterSpacing: -0.2,
  },
});
