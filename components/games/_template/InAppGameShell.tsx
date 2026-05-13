import { Ionicons } from "@expo/vector-icons";
import React, { type ReactNode } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { V2 } from "../../../constants/glassPalette";
import { typography } from "../../../constants/typography";

export type HudPillData = {
  label: string;
  value: string;
};

export type SecondaryAction = {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  onPress: () => void;
  disabled?: boolean;
};

export type LevelCompleteCopy = {
  title: string;
  subtitle: string;
};

export type TutorialCopy = {
  visible: boolean;
  title: string;
  bullets: string[];
  onDismiss: () => void;
};

type InAppGameShellProps = {
  title: string;
  subtitle: string;
  accent: string;
  accentSoft: string;
  accentInk: string;
  hudPills: HudPillData[];
  /** When set, the level-complete callout and Next-Level dock take over. */
  levelComplete: LevelCompleteCopy | null;
  onQuit: () => void;
  onPause: () => void;
  paused: boolean;
  onResume: () => void;
  onRestartLevel: () => void;
  onClaimExit: () => void;
  onNextLevel: () => void;
  /** Secondary actions for the dock when the level is *not* yet complete. */
  secondaryActions: SecondaryAction[];
  /** Optional override for the primary dock label after level complete. */
  nextLevelLabel?: string;
  /** Optional override for the "Claim & exit" secondary on level complete. */
  claimLabel?: string;
  /** Optional first-launch tutorial overlay. Pass copy + visibility from useGameProgress. */
  tutorial?: TutorialCopy;
  children: ReactNode;
};

/**
 * Shared in-app game shell that matches the Jigsaw Puzzle layout:
 * top bar (back / title / pause), HUD pill row, gameplay slot, dock with
 * either a level-complete primary (Next Level + Claim & Exit) or the game's
 * own secondary controls.
 *
 * Used by Word Ladder, Block Blast, Bricks vs Balls and Color Stack.
 */
export function InAppGameShell({
  title,
  subtitle,
  accent,
  accentSoft,
  accentInk,
  hudPills,
  levelComplete,
  onQuit,
  onPause,
  paused,
  onResume,
  onRestartLevel,
  onClaimExit,
  onNextLevel,
  secondaryActions,
  nextLevelLabel = "Next level",
  claimLabel = "Claim & exit",
  tutorial,
  children,
}: InAppGameShellProps) {
  return (
    <View style={[styles.root, { backgroundColor: accentSoft }]}>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Exit game"
            hitSlop={8}
            onPress={onQuit}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          >
            <Ionicons name="chevron-back" size={22} color={V2.ink} />
          </Pressable>

          <View style={styles.titleBlock}>
            <Text numberOfLines={1} adjustsFontSizeToFit style={styles.gameTitle}>
              {title}
            </Text>
            <Text numberOfLines={1} style={styles.gameSubtitle}>
              {subtitle}
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Pause game"
            hitSlop={8}
            onPress={onPause}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          >
            <Ionicons name="pause" size={20} color={V2.ink} />
          </Pressable>
        </View>

        <View style={styles.hudRow}>
          {hudPills.map((pill) => (
            <View key={pill.label} style={styles.hudPill}>
              <Text style={styles.hudLabel}>{pill.label}</Text>
              <Text numberOfLines={1} adjustsFontSizeToFit style={styles.hudValue}>
                {pill.value}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.body}>{children}</View>

        {levelComplete ? (
          <View style={styles.levelCompleteCallout}>
            <View style={[styles.levelCompleteIcon, { backgroundColor: `${accent}22` }]}>
              <Ionicons name="checkmark-circle" size={22} color={accent} />
            </View>
            <View style={styles.levelCompleteCopy}>
              <Text style={styles.levelCompleteTitle}>{levelComplete.title}</Text>
              <Text style={styles.levelCompleteSub} numberOfLines={2}>
                {levelComplete.subtitle}
              </Text>
            </View>
          </View>
        ) : null}

        <View style={styles.controlDock}>
          {levelComplete ? (
            <>
              <GameActionButton
                label={nextLevelLabel}
                icon="play-forward"
                onPress={onNextLevel}
                tone="primary"
                accent={accent}
                accentInk={accentInk}
              />
              <GameActionButton
                label={claimLabel}
                icon="ribbon-outline"
                onPress={onClaimExit}
                tone="secondary"
                accent={accent}
                accentInk={accentInk}
              />
            </>
          ) : secondaryActions.length === 0 ? (
            <View style={styles.dockSpacer} />
          ) : (
            secondaryActions.map((action) => (
              <GameActionButton
                key={action.label}
                label={action.label}
                icon={action.icon}
                onPress={action.onPress}
                disabled={action.disabled}
                tone="secondary"
                accent={accent}
                accentInk={accentInk}
              />
            ))
          )}
        </View>
      </SafeAreaView>

      <PauseModal
        visible={paused}
        onResume={onResume}
        onRestart={onRestartLevel}
        onClaimExit={onClaimExit}
        onQuit={onQuit}
      />

      {tutorial ? (
        <TutorialOverlay
          visible={tutorial.visible}
          title={tutorial.title}
          bullets={tutorial.bullets}
          accent={accent}
          accentInk={accentInk}
          onDismiss={tutorial.onDismiss}
        />
      ) : null}
    </View>
  );
}

/**
 * One-shot tutorial modal shown on first launch of a game. Title, bulleted
 * rules, primary "Got it" CTA. Gate from the parent via `useGameProgress`'s
 * `tutorialSeen` flag.
 */
export function TutorialOverlay({
  visible,
  title,
  bullets,
  accent,
  accentInk,
  onDismiss,
}: {
  visible: boolean;
  title: string;
  bullets: string[];
  accent: string;
  accentInk: string;
  onDismiss: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.modalScrim}>
        <View style={styles.tutorialCard}>
          <View style={[styles.tutorialBadge, { backgroundColor: `${accent}22`, borderColor: accentInk }]}>
            <Ionicons name="bulb-outline" size={20} color={accentInk} />
          </View>
          <Text style={styles.tutorialTitle}>{title}</Text>
          <View style={styles.tutorialBullets}>
            {bullets.map((bullet, idx) => (
              <View key={idx} style={styles.tutorialBulletRow}>
                <View style={[styles.tutorialBulletDot, { backgroundColor: accent }]} />
                <Text style={styles.tutorialBulletText}>{bullet}</Text>
              </View>
            ))}
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={onDismiss}
            style={({ pressed }) => [
              styles.tutorialCta,
              { backgroundColor: accent, borderColor: accentInk },
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="play" size={16} color="#FFFFFF" />
            <Text style={styles.tutorialCtaText}>Got it — let's play</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

/**
 * Shared in-game action button. Used by the shell dock AND by individual
 * games for body-level controls (e.g. Plinko Left/DROP/Right). Equal flex
 * distribution, bordered pill, circular icon "well", black bold label.
 *
 * Keep this shared so every game's button row stays visually consistent.
 */
export function GameActionButton({
  label,
  icon,
  onPress,
  disabled,
  tone = "secondary",
  accent,
  accentInk,
  flex = 1,
}: {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  onPress: () => void;
  disabled?: boolean;
  tone?: "primary" | "secondary";
  accent: string;
  accentInk: string;
  flex?: number;
}) {
  const wellBackground = tone === "primary" ? accent : `${accent}22`;
  const wellBorder = tone === "primary" ? accent : `${accentInk}33`;
  const iconColor = tone === "primary" ? "#FFFFFF" : accentInk;
  const borderColor = tone === "primary" ? accentInk : "rgba(0,0,0,0.22)";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.actionButton,
        { flex, borderColor, borderWidth: tone === "primary" ? 2 : 1.5 },
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.actionIconWell,
          { backgroundColor: wellBackground, borderColor: wellBorder },
        ]}
      >
        <Ionicons name={icon} size={16} color={iconColor} />
      </View>
      <Text numberOfLines={1} style={styles.actionLabel}>
        {label}
      </Text>
    </Pressable>
  );
}

function PauseModal({
  visible,
  onResume,
  onRestart,
  onClaimExit,
  onQuit,
}: {
  visible: boolean;
  onResume: () => void;
  onRestart: () => void;
  onClaimExit: () => void;
  onQuit: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onResume}>
      <View style={styles.modalScrim}>
        <View style={styles.modalCard}>
          <Text style={styles.modalEyebrow}>Paused</Text>
          <Text style={styles.modalTitle}>Take a breath</Text>
          <Pressable
            accessibilityRole="button"
            onPress={onResume}
            style={({ pressed }) => [styles.modalPrimary, pressed && styles.pressed]}
          >
            <Text style={styles.modalPrimaryText}>Resume</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={onRestart}
            style={({ pressed }) => [styles.modalSecondary, pressed && styles.pressed]}
          >
            <Text style={styles.modalSecondaryText}>Restart level</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={onClaimExit}
            style={({ pressed }) => [styles.modalSecondary, pressed && styles.pressed]}
          >
            <Text style={styles.modalSecondaryText}>Claim score & exit</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={onQuit}
            style={({ pressed }) => [styles.modalExit, pressed && styles.pressed]}
          >
            <Text style={styles.modalExitText}>Exit without claiming</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 16,
  },
  topBar: {
    width: "100%",
    maxWidth: 430,
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.78)",
    borderWidth: 1,
    borderColor: V2.hairlineStrong,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  gameTitle: {
    ...typography.bold,
    fontSize: 20,
    color: V2.ink,
    letterSpacing: 0,
  },
  gameSubtitle: {
    ...typography.medium,
    marginTop: 2,
    fontSize: 12,
    color: V2.muted,
    letterSpacing: 0,
  },
  hudRow: {
    width: "100%",
    maxWidth: 430,
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  hudPill: {
    flex: 1,
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.86)",
    borderWidth: 1,
    borderColor: V2.hairline,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  hudLabel: {
    ...typography.medium,
    fontSize: 10,
    color: V2.muted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  hudValue: {
    ...typography.bold,
    marginTop: 3,
    fontSize: 18,
    color: V2.ink,
    fontVariant: ["tabular-nums"],
    letterSpacing: 0,
  },
  body: {
    flex: 1,
    width: "100%",
    maxWidth: 430,
    marginTop: 10,
  },
  controlDock: {
    width: "100%",
    maxWidth: 430,
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 10,
    paddingBottom: 8,
  },
  dockSpacer: {
    flex: 1,
    minHeight: 56,
  },
  actionButton: {
    minWidth: 0,
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  actionIconWell: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    ...typography.bold,
    fontSize: 13,
    color: V2.ink,
    letterSpacing: 0.2,
    textAlign: "center",
  },
  levelCompleteCallout: {
    width: "100%",
    maxWidth: 430,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: V2.hairline,
    backgroundColor: "rgba(255,255,255,0.86)",
  },
  levelCompleteIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  levelCompleteCopy: {
    flex: 1,
    minWidth: 0,
  },
  levelCompleteTitle: {
    ...typography.bold,
    fontSize: 16,
    color: V2.ink,
    letterSpacing: 0,
  },
  levelCompleteSub: {
    ...typography.semibold,
    marginTop: 2,
    fontSize: 12,
    lineHeight: 16,
    color: V2.muted,
    letterSpacing: 0,
  },
  pressed: {
    opacity: 0.78,
  },
  disabled: {
    opacity: 0.45,
  },
  modalScrim: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(0,0,0,0.34)",
  },
  modalCard: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: V2.hairline,
    padding: 22,
    alignItems: "center",
  },
  modalEyebrow: {
    ...typography.bold,
    fontSize: 12,
    color: V2.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  modalTitle: {
    ...typography.bold,
    marginTop: 8,
    fontSize: 24,
    color: V2.ink,
    textAlign: "center",
    letterSpacing: 0,
  },
  modalPrimary: {
    width: "100%",
    minHeight: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
    backgroundColor: V2.blueDeep,
  },
  modalPrimaryText: {
    ...typography.bold,
    fontSize: 15,
    color: "#FFFFFF",
    letterSpacing: 0,
  },
  modalSecondary: {
    width: "100%",
    minHeight: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    backgroundColor: V2.cyanSoft,
  },
  modalSecondaryText: {
    ...typography.bold,
    fontSize: 14,
    color: V2.cyanInk,
    letterSpacing: 0,
  },
  modalExit: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    paddingHorizontal: 16,
  },
  modalExitText: {
    ...typography.bold,
    fontSize: 14,
    color: V2.muted,
    letterSpacing: 0,
  },
  tutorialCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: V2.hairline,
    padding: 22,
    alignItems: "center",
  },
  tutorialBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  tutorialTitle: {
    ...typography.bold,
    marginTop: 12,
    fontSize: 22,
    color: V2.ink,
    textAlign: "center",
  },
  tutorialBullets: {
    width: "100%",
    marginTop: 14,
    gap: 10,
  },
  tutorialBulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  tutorialBulletDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  tutorialBulletText: {
    ...typography.semibold,
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: V2.ink,
  },
  tutorialCta: {
    width: "100%",
    minHeight: 52,
    borderRadius: 26,
    borderWidth: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 18,
  },
  tutorialCtaText: {
    ...typography.bold,
    fontSize: 15,
    color: "#FFFFFF",
    letterSpacing: 0.4,
  },
});
