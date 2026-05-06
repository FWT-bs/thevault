# Pressable layout gotcha

## Symptom

A `Pressable` styled with `flexDirection: "row"`, `alignItems: "center"`,
`justifyContent: "center"` (and a `Text` + `Icon` as children) renders the
text and icon flush to opposite edges, or off-center, instead of as a
centered group. Happens most reliably on iOS when `style` is passed as a
function (`style={({ pressed }) => [...]}`).

## Cause

`Pressable`'s root element is a `View`, but its style merging is fragile
with mixed-element children (Text + native icon glyph). Layout properties
applied directly to the `Pressable` are not always honored by the inner
host component on iOS. The hero "Play" button (`heroPlayButton`) and the
streak claim button (`streakClaimContent`) avoid this by keeping the
`Pressable` as a thin touch target and putting layout on a child `View`.

## Fix

Put **only** background color, border, shadow, and `borderRadius` on the
`Pressable`. Wrap its children in an inner `View` that owns
`flexDirection`, `alignItems`, `justifyContent`, `width: "100%"`, and any
horizontal padding. Mark that wrapper `pointerEvents="none"` so taps
still land on the `Pressable`.

```tsx
<Pressable
  onPress={...}
  style={({ pressed }) => [
    styles.button,                  // bg / border / radius / shadow only
    pressed && { opacity: 0.92 },
  ]}
>
  <View pointerEvents="none" style={styles.buttonContent}>
    <Text style={styles.buttonText}>{label}</Text>
    <Ionicons name="arrow-forward" size={13} color="#000" />
  </View>
</Pressable>
```

```ts
button: {
  borderRadius: 13,
  shadowColor: GLASS.charcoal,
  shadowOpacity: 0.12,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 3 },
},
buttonContent: {
  width: "100%",
  minHeight: 32,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  paddingHorizontal: 10,
},
buttonText: {
  ...typography.bold,
  marginRight: 6,                   // prefer marginRight over `gap` —
  fontSize: 12,                     // `gap` is RN >= 0.71 only and has
  color: "#000",                    // had row-direction quirks with
},                                  // mixed Text+Icon children.
```

## Rule of thumb

If a `Pressable` has more than one child (Text + Icon, two icons, etc.),
default to a child `View` that owns the row layout. Don't layout the
Pressable itself.

Working examples in this repo: `heroPlayButton` (`app/home.tsx`),
`streakClaimContent` (`app/home.tsx`), `rewardCardButtonContent`
(`app/home.tsx`).
