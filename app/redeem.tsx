import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { formatSharePercent } from "@thevault/domain";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import LottieView from "lottie-react-native";
import { AnimatePresence, MotiView } from "moti";
import React, { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { GLASS } from "../constants/glassPalette";
import { typography } from "../constants/typography";
import { usePayoutGuardrails } from "../services/features/monetization";
import { useCreateRedemption } from "../services/features/redemption";
import { useRiskEvaluate } from "../services/features/risk";
import { useVaultLevel } from "../services/features/vaultLevel";
import { useWalletBalance } from "../services/features/wallet";

const CHECKMARK_ANIMATION = require("../assets/checkmark.json");

type RedeemTab = "gift" | "paypal" | "crypto";

interface GiftCardBrand {
  id: string;
  brand: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  cardColor: string;
}

const GIFT_CARDS: GiftCardBrand[] = [
  { id: "amazon", brand: "Amazon", icon: "shopping-outline", cardColor: "#FFD7C2" },
  { id: "visa", brand: "Visa", icon: "credit-card-outline", cardColor: "#A9E5FF" },
  { id: "starbucks", brand: "Starbucks", icon: "coffee-outline", cardColor: "#CDEFD8" },
  { id: "target", brand: "Target", icon: "bullseye-arrow", cardColor: "#F4A4A4" },
  { id: "spotify", brand: "Spotify", icon: "music-circle-outline", cardColor: "#9FE2B5" },
  { id: "playstation", brand: "PlayStation", icon: "gamepad-square-outline", cardColor: "#DED1FB" },
];

const GIFT_DENOMINATIONS = [5, 10, 25, 50] as const;
const PAYPAL_QUICK_AMOUNTS = [5, 10, 20, 25, 50, 100] as const;
const CR_PER_USD = 100;
const GIFT_MIN_USD = 10;
const CASH_MIN_USD = 20;

export default function RedeemPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: wallet } = useWalletBalance();
  const { data: vaultLevel } = useVaultLevel();
  const createRedemption = useCreateRedemption();
  const riskEvaluate = useRiskEvaluate();
  const payoutGuardrails = usePayoutGuardrails();
  const [tab, setTab] = useState<RedeemTab>("gift");
  const [confirmed, setConfirmed] = useState<{
    method: string;
    amount: string;
    creditsSpent: number;
  } | null>(null);

  // gift state
  const [selectedBrand, setSelectedBrand] = useState<GiftCardBrand | null>(null);
  const [giftDenomination, setGiftDenomination] = useState<number>(10);
  // paypal state
  const [paypalEmail, setPaypalEmail] = useState("");
  const [paypalAmount, setPaypalAmount] = useState<number>(20);

  const availableCredits = wallet?.availableCredits ?? wallet?.credits ?? 0;
  const balanceUSD = ((wallet?.availableUsd ?? wallet?.usdBalance ?? 0)).toFixed(2);
  const shareLabel = formatSharePercent(vaultLevel?.revenueShareBps ?? wallet?.currentShareBps ?? 3000);

  const summary = useMemo(() => {
    if (tab === "gift" && selectedBrand) {
      return {
        method: `${selectedBrand.brand} gift card`,
        amount: `$${giftDenomination}.00`,
        creditsSpent: giftDenomination * CR_PER_USD,
        canRedeem: giftDenomination >= GIFT_MIN_USD && giftDenomination * CR_PER_USD <= availableCredits,
      };
    }
    if (tab === "paypal") {
      return {
        method: "PayPal",
        amount: `$${paypalAmount}.00`,
        creditsSpent: paypalAmount * CR_PER_USD,
        canRedeem:
          paypalAmount >= CASH_MIN_USD &&
          paypalAmount * CR_PER_USD <= availableCredits &&
          paypalEmail.includes("@"),
      };
    }
    return null;
  }, [tab, selectedBrand, giftDenomination, paypalAmount, paypalEmail]);

  const handleRedeem = async () => {
    if (!summary?.canRedeem) return;
    const amountUsd = Number(summary.amount.replace("$", "").replace(".00", ""));
    const risk = await riskEvaluate.mutateAsync({
      action: "redemption_create",
      amountCredits: summary.creditsSpent,
    });
    const guardrails = await payoutGuardrails.mutateAsync({
      amountUsd,
      riskLevel: risk.risk.level,
      method: tab === "gift" ? "gift_card" : tab,
    });
    if (!guardrails.guardrails.passesMin) return;
    await createRedemption.mutateAsync({
      method: tab === "gift" ? "gift_card" : tab,
      amountUsd,
      destination: tab === "paypal" ? paypalEmail : summary.method,
    });
    setConfirmed({
      method: summary.method,
      amount: summary.amount,
      creditsSpent: summary.creditsSpent,
    });
  };

  if (confirmed) {
    return (
      <RedeemConfirmation
        method={confirmed.method}
        amount={confirmed.amount}
        creditsSpent={confirmed.creditsSpent}
        onDone={() => router.back()}
      />
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
        <StatusBar style="dark" />

        {/* Header */}
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backButton,
              pressed && { opacity: 0.7, transform: [{ scale: 0.96 }] },
            ]}
            hitSlop={6}
          >
            <Ionicons name="chevron-back" size={20} color="#000000" />
          </Pressable>
          <Text style={styles.headerTitle}>Cash Out</Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 140 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Balance summary */}
          <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 380 }}
            style={styles.balanceCard}
          >
            <Text style={styles.balanceLabel}>Available to redeem</Text>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceCurrency}>$</Text>
              <Text style={styles.balanceValue}>{balanceUSD}</Text>
            </View>
            <Text style={styles.balanceCredits}>
              {availableCredits.toLocaleString()} confirmed credits · pending cannot be withdrawn
            </Text>
            <View style={styles.redeemGuardrailRow}>
              <View style={styles.redeemGuardrailPill}>
                <Text style={styles.redeemGuardrailText}>Gift cards ${GIFT_MIN_USD}+</Text>
              </View>
              <View style={styles.redeemGuardrailPill}>
                <Text style={styles.redeemGuardrailText}>Cash ${CASH_MIN_USD}+</Text>
              </View>
              <View style={styles.redeemGuardrailPill}>
                <Text style={styles.redeemGuardrailText}>{shareLabel} share</Text>
              </View>
            </View>
            <View style={styles.pendingLockRow}>
              <Text style={styles.pendingLockText}>Pending ${((wallet?.pendingUsd ?? 0)).toFixed(2)}</Text>
              <Text style={styles.pendingLockText}>Locked ${((wallet?.lockedUsd ?? 0)).toFixed(2)}</Text>
            </View>
          </MotiView>

          {/* Tab picker */}
          <View style={styles.tabRow}>
            <TabButton
              label="Gift Cards"
              icon="gift-outline"
              active={tab === "gift"}
              onPress={() => setTab("gift")}
            />
            <TabButton
              label="PayPal"
              icon="email-outline"
              active={tab === "paypal"}
              onPress={() => setTab("paypal")}
            />
            <TabButton
              label="Crypto"
              icon="bitcoin"
              active={tab === "crypto"}
              onPress={() => setTab("crypto")}
            />
          </View>

          {/* Tab content */}
          <View style={{ marginTop: 18 }}>
            <AnimatePresence exitBeforeEnter>
              {tab === "gift" && (
                <MotiView
                  key="gift"
                  from={{ opacity: 0, translateY: 8 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: "timing", duration: 260 }}
                >
                  <GiftCardGrid
                    cards={GIFT_CARDS}
                    selected={selectedBrand}
                    onSelect={setSelectedBrand}
                  />
                  {selectedBrand ? (
                    <View style={styles.denomBlock}>
                      <Text style={styles.fieldLabel}>Choose amount</Text>
                      <View style={styles.denomRow}>
                        {GIFT_DENOMINATIONS.map((amt) => {
                          const required = amt * CR_PER_USD;
                          const enabled = amt >= GIFT_MIN_USD && required <= availableCredits;
                          const active = giftDenomination === amt;
                          return (
                            <Pressable
                              key={amt}
                              onPress={() => enabled && setGiftDenomination(amt)}
                              disabled={!enabled}
                              style={({ pressed }) => [
                                styles.denomTile,
                                active && styles.denomTileActive,
                                !enabled && styles.denomTileDisabled,
                                pressed && enabled && { transform: [{ scale: 0.96 }] },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.denomAmount,
                                  active && styles.denomAmountActive,
                                  !enabled && styles.denomAmountDisabled,
                                ]}
                              >
                                ${amt}
                              </Text>
                              <Text
                                style={[
                                  styles.denomCredits,
                                  active && styles.denomCreditsActive,
                                  !enabled && styles.denomCreditsDisabled,
                                ]}
                              >
                                {required.toLocaleString()} CR
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  ) : null}
                </MotiView>
              )}
              {tab === "paypal" && (
                <MotiView
                  key="paypal"
                  from={{ opacity: 0, translateY: 8 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: "timing", duration: 260 }}
                >
                  <PayPalForm
                    email={paypalEmail}
                    onChangeEmail={setPaypalEmail}
                    amount={paypalAmount}
                    onChangeAmount={setPaypalAmount}
                    availableCredits={availableCredits}
                  />
                </MotiView>
              )}
              {tab === "crypto" && (
                <MotiView
                  key="crypto"
                  from={{ opacity: 0, translateY: 8 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: "timing", duration: 260 }}
                  style={styles.cryptoComingSoon}
                >
                  <View style={styles.cryptoIconWrap}>
                    <Ionicons name="time-outline" size={28} color="#000000" />
                  </View>
                  <Text style={styles.cryptoTitle}>Coming soon</Text>
                  <Text style={styles.cryptoSub}>
                    Crypto cashouts (BTC, ETH, USDC) are launching next month.
                  </Text>
                </MotiView>
              )}
            </AnimatePresence>
          </View>
        </ScrollView>

        {/* Sticky bottom bar */}
        <View
          style={[
            styles.stickyBar,
            { paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          <View style={styles.stickyInner}>
            <View style={{ flex: 1 }}>
              <Text style={styles.stickyLabel}>Redeeming</Text>
              <Text style={styles.stickyValue} numberOfLines={1}>
                {summary
                  ? `${summary.creditsSpent.toLocaleString()} CR → ${summary.amount} ${summary.method}`
                  : tab === "crypto"
                    ? "Crypto cashout coming soon"
                    : "Pick a method to continue"}
              </Text>
            </View>
            <Pressable
              onPress={handleRedeem}
              disabled={!summary?.canRedeem}
              style={({ pressed }) => [
                styles.confirmButton,
                !summary?.canRedeem && styles.confirmButtonDisabled,
                pressed && summary?.canRedeem && { opacity: 0.92 },
              ]}
            >
              <View pointerEvents="none" style={styles.confirmButtonContent}>
                <Text
                  style={[
                    styles.confirmButtonText,
                    !summary?.canRedeem && { color: GLASS.inkFaint },
                  ]}
                >
                  Redeem
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={14}
                  color={summary?.canRedeem ? "#000000" : GLASS.inkFaint}
                />
              </View>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ----------------------------------------------------------------------

function TabButton({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tabButton,
        active && styles.tabButtonActive,
        pressed && { opacity: 0.86 },
      ]}
    >
      <View pointerEvents="none" style={styles.tabButtonContent}>
        <MaterialCommunityIcons
          name={icon}
          size={14}
          color={active ? "#000000" : GLASS.inkMuted}
        />
        <Text
          style={[
            styles.tabButtonText,
            active && { color: "#000000" },
          ]}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

function GiftCardGrid({
  cards,
  selected,
  onSelect,
}: {
  cards: GiftCardBrand[];
  selected: GiftCardBrand | null;
  onSelect: (b: GiftCardBrand) => void;
}) {
  return (
    <View>
      <Text style={styles.fieldLabel}>Pick a brand</Text>
      <View style={styles.giftGrid}>
        {cards.map((c) => {
          const isActive = selected?.id === c.id;
          return (
            <Pressable
              key={c.id}
              onPress={() => onSelect(c)}
              style={({ pressed }) => [
                styles.giftTile,
                { backgroundColor: c.cardColor },
                isActive && styles.giftTileActive,
                pressed && { transform: [{ scale: 0.96 }] },
              ]}
            >
              <View style={styles.giftIconCircle}>
                <MaterialCommunityIcons name={c.icon} size={22} color="#000000" />
              </View>
              <Text style={styles.giftBrandText}>{c.brand}</Text>
              {isActive ? (
                <View style={styles.giftCheck}>
                  <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function PayPalForm({
  email,
  onChangeEmail,
  amount,
  onChangeAmount,
  availableCredits,
}: {
  email: string;
  onChangeEmail: (s: string) => void;
  amount: number;
  onChangeAmount: (n: number) => void;
  availableCredits: number;
}) {
  const required = amount * CR_PER_USD;
  return (
    <View>
      <Text style={styles.fieldLabel}>PayPal email</Text>
      <View style={styles.emailField}>
        <Ionicons name="mail-outline" size={18} color={GLASS.inkMuted} />
        <TextInput
          value={email}
          onChangeText={onChangeEmail}
          placeholder="you@example.com"
          placeholderTextColor={GLASS.inkFaint}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.emailInput}
        />
      </View>

      <Text style={[styles.fieldLabel, { marginTop: 18 }]}>Amount</Text>
      <View style={styles.paypalAmountRow}>
        {PAYPAL_QUICK_AMOUNTS.map((amt) => {
          const reqd = amt * CR_PER_USD;
          const enabled = amt >= CASH_MIN_USD && reqd <= availableCredits;
          const active = amount === amt;
          return (
            <Pressable
              key={amt}
              onPress={() => enabled && onChangeAmount(amt)}
              disabled={!enabled}
              style={({ pressed }) => [
                styles.paypalAmountTile,
                active && styles.paypalAmountTileActive,
                !enabled && styles.paypalAmountTileDisabled,
                pressed && enabled && { transform: [{ scale: 0.96 }] },
              ]}
            >
              <Text
                style={[
                  styles.paypalAmountText,
                  active && styles.paypalAmountTextActive,
                  !enabled && styles.paypalAmountTextDisabled,
                ]}
              >
                ${amt}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.conversionCard}>
        <View style={styles.conversionLeft}>
          <Text style={styles.conversionLabel}>Conversion</Text>
          <Text style={styles.conversionValue}>
            {required.toLocaleString()} CR = ${amount}.00
          </Text>
        </View>
        <Ionicons name="arrow-forward" size={16} color="#000000" />
      </View>
    </View>
  );
}

// ----------------------------------------------------------------------

function RedeemConfirmation({
  method,
  amount,
  creditsSpent,
  onDone,
}: {
  method: string;
  amount: string;
  creditsSpent: number;
  onDone: () => void;
}) {
  const insets = useSafeAreaInsets();
  const referenceId = `VLT-${Date.now().toString().slice(-6)}`;
  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
        <StatusBar style="dark" />
        <View style={styles.confirmRoot}>
          <MotiView
            from={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", damping: 14, stiffness: 220 }}
            style={styles.confirmIconWrap}
          >
            <LottieView
              source={CHECKMARK_ANIMATION}
              autoPlay
              loop={false}
              style={{ width: 130, height: 130 }}
            />
          </MotiView>

          <Text style={styles.confirmTitle}>Request submitted!</Text>
          <Text style={styles.confirmSub}>
            We're processing your cash out. Most arrive within 24 hours.
          </Text>

          <View style={styles.confirmDetailsCard}>
            <DetailRow label="Method" value={method} />
            <DetailRow label="Amount" value={amount} />
            <DetailRow
              label="Credits used"
              value={`${creditsSpent.toLocaleString()} CR`}
            />
            <DetailRow label="Estimated delivery" value="Within 24 hours" />
            <DetailRow label="Reference ID" value={referenceId} isLast />
          </View>
        </View>

        <View
          style={[
            styles.confirmDoneWrap,
            { paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          <View style={styles.confirmDoneBorder}>
            <Pressable
              onPress={onDone}
              style={({ pressed }) => [
                styles.confirmDoneButton,
                pressed && { opacity: 0.94 },
              ]}
            >
              <View pointerEvents="none" style={styles.confirmDoneContent}>
                <Text style={styles.confirmDoneText}>Back to Wallet</Text>
                <Ionicons name="arrow-forward" size={16} color="#000000" />
              </View>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

function DetailRow({
  label,
  value,
  isLast,
}: {
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.detailRow, isLast && { borderBottomWidth: 0 }]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  headerRow: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
  },
  headerTitle: {
    ...typography.bold,
    fontSize: 18,
    letterSpacing: -0.4,
    color: "#000000",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  balanceCard: {
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    padding: 22,
    overflow: "hidden",
    backgroundColor: "#1A1A1F",
  },
  balanceLabel: {
    ...typography.bold,
    fontSize: 10,
    letterSpacing: 1.6,
    color: "rgba(253,251,246,0.62)",
    textTransform: "uppercase",
  },
  balanceRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  balanceCurrency: {
    ...typography.bold,
    fontSize: 22,
    color: "rgba(253,251,246,0.84)",
    marginRight: 2,
    marginBottom: 6,
  },
  balanceValue: {
    ...typography.bold,
    fontSize: 46,
    color: "#FFFFFF",
    letterSpacing: -1.4,
    lineHeight: 50,
  },
  balanceCredits: {
    ...typography.medium,
    marginTop: 6,
    fontSize: 12,
    color: "rgba(253,251,246,0.66)",
  },
  redeemGuardrailRow: {
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  redeemGuardrailPill: {
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 9,
    backgroundColor: "rgba(253,251,246,0.12)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(253,251,246,0.2)",
  },
  redeemGuardrailText: {
    ...typography.bold,
    fontSize: 10,
    color: "rgba(253,251,246,0.86)",
  },
  pendingLockRow: {
    marginTop: 10,
    flexDirection: "row",
    gap: 12,
  },
  pendingLockText: {
    ...typography.semibold,
    fontSize: 11,
    color: "rgba(253,251,246,0.66)",
  },
  tabRow: {
    marginTop: 22,
    flexDirection: "row",
    alignItems: "center",
    padding: 4,
    borderRadius: 22,
    backgroundColor: "#F5F5F7",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    gap: 4,
  },
  tabButton: {
    flex: 1,
    height: 40,
    borderRadius: 18,
    backgroundColor: "transparent",
  },
  tabButtonActive: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
  },
  tabButtonContent: {
    width: "100%",
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  tabButtonText: {
    ...typography.bold,
    fontSize: 12,
    letterSpacing: -0.2,
    color: GLASS.inkMuted,
  },
  fieldLabel: {
    ...typography.bold,
    marginBottom: 10,
    marginLeft: 2,
    fontSize: 11,
    letterSpacing: 0.6,
    color: GLASS.inkMuted,
    textTransform: "uppercase",
  },
  giftGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  giftTile: {
    width: "31%",
    minHeight: 100,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  giftTileActive: {
    borderWidth: 3,
    shadowOpacity: 0.22,
    shadowRadius: 10,
  },
  giftIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "rgba(255,255,255,0.7)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  giftBrandText: {
    ...typography.bold,
    fontSize: 11,
    color: "#000000",
    letterSpacing: -0.2,
    textAlign: "center",
  },
  giftCheck: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },
  denomBlock: {
    marginTop: 22,
  },
  denomRow: {
    flexDirection: "row",
    gap: 10,
  },
  denomTile: {
    flex: 1,
    minHeight: 64,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  denomTileActive: {
    backgroundColor: "#A9E5FF",
    borderWidth: 1,
  },
  denomTileDisabled: {
    borderColor: GLASS.inkFaint,
    backgroundColor: "#F5F5F7",
  },
  denomAmount: {
    ...typography.bold,
    fontSize: 16,
    color: "#000000",
    letterSpacing: -0.4,
  },
  denomAmountActive: {
    color: "#000000",
  },
  denomAmountDisabled: {
    color: GLASS.inkFaint,
  },
  denomCredits: {
    ...typography.medium,
    marginTop: 2,
    fontSize: 9,
    color: GLASS.inkMuted,
    letterSpacing: 0.2,
  },
  denomCreditsActive: {
    color: "#000000",
  },
  denomCreditsDisabled: {
    color: GLASS.inkFaint,
  },

  // PayPal
  emailField: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "#FFFFFF",
  },
  emailInput: {
    ...typography.semibold,
    flex: 1,
    fontSize: 14,
    color: "#000000",
    letterSpacing: -0.2,
    paddingVertical: 0,
  },
  paypalAmountRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  paypalAmountTile: {
    minWidth: 64,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  paypalAmountTileActive: {
    backgroundColor: "#A9E5FF",
    borderWidth: 1,
  },
  paypalAmountTileDisabled: {
    backgroundColor: "#F5F5F7",
    borderColor: GLASS.inkFaint,
  },
  paypalAmountText: {
    ...typography.bold,
    fontSize: 14,
    color: "#000000",
    letterSpacing: -0.3,
  },
  paypalAmountTextActive: {
    color: "#000000",
  },
  paypalAmountTextDisabled: {
    color: GLASS.inkFaint,
  },
  conversionCard: {
    marginTop: 18,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "#F5F5F7",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  conversionLeft: {
    flex: 1,
  },
  conversionLabel: {
    ...typography.bold,
    fontSize: 9,
    letterSpacing: 0.6,
    color: GLASS.inkMuted,
    textTransform: "uppercase",
  },
  conversionValue: {
    ...typography.bold,
    marginTop: 3,
    fontSize: 15,
    color: "#000000",
    letterSpacing: -0.3,
  },

  cryptoComingSoon: {
    paddingVertical: 30,
    alignItems: "center",
  },
  cryptoIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "#F6D98A",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  cryptoTitle: {
    ...typography.bold,
    fontSize: 18,
    letterSpacing: -0.4,
    color: "#000000",
  },
  cryptoSub: {
    ...typography.medium,
    marginTop: 6,
    paddingHorizontal: 32,
    fontSize: 12,
    color: GLASS.inkMuted,
    textAlign: "center",
  },

  // Sticky bar
  stickyBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderTopWidth: 2,
    borderTopColor: "#000000",
  },
  stickyInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stickyLabel: {
    ...typography.bold,
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: GLASS.inkMuted,
  },
  stickyValue: {
    ...typography.bold,
    marginTop: 3,
    fontSize: 13,
    color: "#000000",
    letterSpacing: -0.2,
  },
  confirmButton: {
    minHeight: 50,
    paddingHorizontal: 20,
    borderRadius: 18,
    backgroundColor: "#A9E5FF",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
  },
  confirmButtonDisabled: {
    backgroundColor: "#F5F5F7",
    borderColor: GLASS.inkFaint,
  },
  confirmButtonContent: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmButtonText: {
    ...typography.bold,
    marginRight: 6,
    fontSize: 14,
    color: "#000000",
    letterSpacing: -0.3,
  },

  // Confirmation
  confirmRoot: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 30,
    alignItems: "center",
  },
  confirmIconWrap: {
    width: 144,
    height: 144,
    borderRadius: 72,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "#CDEFD8",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  confirmTitle: {
    ...typography.bold,
    marginTop: 20,
    fontSize: 26,
    letterSpacing: -0.7,
    color: "#000000",
  },
  confirmSub: {
    ...typography.medium,
    marginTop: 6,
    paddingHorizontal: 18,
    fontSize: 13,
    lineHeight: 18,
    color: GLASS.inkMuted,
    textAlign: "center",
  },
  confirmDetailsCard: {
    marginTop: 26,
    alignSelf: "stretch",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.16)",
  },
  detailLabel: {
    ...typography.medium,
    fontSize: 12,
    color: GLASS.inkMuted,
    letterSpacing: 0.2,
  },
  detailValue: {
    ...typography.bold,
    fontSize: 13,
    color: "#000000",
    letterSpacing: -0.2,
  },
  confirmDoneWrap: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  confirmDoneBorder: {
    borderRadius: 30,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    padding: 2,
  },
  confirmDoneButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: "#A9E5FF",
  },
  confirmDoneContent: {
    width: "100%",
    height: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmDoneText: {
    ...typography.bold,
    marginRight: 8,
    fontSize: 15,
    color: "#000000",
    letterSpacing: -0.3,
  },
});
