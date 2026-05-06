# UI Design Language

The visual language used by `app/home.tsx`. Apply these rules to every screen
so the app stays consistent.

## Principles

- **Soft, not bold.** No 2px black borders, no shadows, no gradients on
  surfaces. Those three together are what make screens read as
  "AI-generated."
- **Color carries meaning, the frame stays quiet.** Keep the colorful pastel
  fills and tinted icons; let them do the work. Borders and frames recede.
- **Layered buttons over drop shadows.** When a button needs to feel raised,
  wrap it in a thin outer "border frame" of the same soft border. Don't
  reach for shadows.

## Tokens

| Token                  | Value                  | Use                                                   |
|------------------------|------------------------|-------------------------------------------------------|
| Soft border color      | `rgba(0,0,0,0.12)`     | Every visible border on a card, pill, button frame.   |
| Soft border width      | `1`                    | Default. Never `1.5` or `2` for the soft border.      |
| Hairline border color  | `rgba(0,0,0,0.16)`     | Internal dividers (e.g. row separators in lists).     |
| Hairline border width  | `StyleSheet.hairlineWidth` | Internal dividers only.                            |
| Card radius (large)    | `20–26`                | Hero / feature cards.                                 |
| Card radius (medium)   | `16–22`                | Section cards, summary bars.                          |
| Pill radius            | `999`                  | Badges, capsule buttons.                              |
| Surface white          | `#FFFFFF`              | Card background when no accent fill is wanted.        |
| Page background        | `#FFFFFF`              | `TabScreen` `backgroundColor`.                        |

## Color usage

Solid pastel fills only — never `LinearGradient`. Pull from the palettes
already used in `home.tsx`:

- Cyan / sky: `#A9E5FF`, `#BAE6FD`, `#E0F2FE`
- Mint: `#9FE2B5`, `#CDEFD8`
- Peach: `#FFB389`, `#FFD7C2`
- Lavender: `#BFA8F0`, `#DED1FB`
- Sand: `#F6D98A`
- Coral: `#F4A4A4`

Pick the lightest tone for a card's whole background; pick the medium tone
for an inner accent (icon tile, tag).

## Borders

```ts
borderWidth: 1,
borderColor: "rgba(0,0,0,0.12)",
```

Apply to: cards, badges, pills, frames, icon tiles, button frames. Use this
**everywhere** a previous version had `borderWidth: 2, borderColor:
"#000000"`. The bold black was page-noise; the soft gray is structure.

For hairline dividers inside a list (e.g. activity rows), use:

```ts
borderBottomWidth: StyleSheet.hairlineWidth,
borderBottomColor: "rgba(0,0,0,0.16)",
```

## Shadows: don't

No `shadowColor` / `shadowOpacity` / `shadowRadius` / `shadowOffset` /
`elevation` on rendered cards or buttons. The drop-shadow halo is the
single biggest visual cue that a screen was AI-generated.

The one exception: transient interaction states. The drag-lift on a
draggable section in `home.tsx` keeps a shadow while held, because the lift
is a mobile affordance, not decoration. If you need to convey hierarchy on
a static surface, use the soft border instead.

## Gradients: don't

No `LinearGradient` / `ExpoGradient` on backgrounds. If a card was reaching
for "depth" via a multi-stop gradient, replace it with the lightest stop as
a flat `backgroundColor`. See `BestEarnerToday` in `home.tsx` for the
pattern: `slide.color` is a single hex, not a 3-stop array.

The other thing gradients are sometimes used for is a "glow blob" overlay
(a translucent white circle in the corner of a card). Don't. Delete the
blob — the flat pastel reads cleanly on its own.

## Layered button frames

The pattern when a button should feel slightly raised:

```tsx
<View style={styles.frame}>
  <Pressable style={styles.button}>
    <View pointerEvents="none" style={styles.content}>
      <Text>{label}</Text>
      <Icon />
    </View>
  </Pressable>
</View>
```

```ts
frame: {
  borderRadius: 20,
  backgroundColor: "#FFFFFF",
  borderWidth: 1,
  borderColor: "rgba(0,0,0,0.12)",
  padding: 2,
},
button: {
  borderRadius: 16,           // outer radius minus padding
  backgroundColor: "#A9E5FF", // accent fill
},
content: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  paddingHorizontal: 10,
  minHeight: 46,
},
```

Three things to notice:

1. **Layout lives on `content`, not on `Pressable`.** This is a recurring
   iOS gotcha — see `docs/react-native-pressable-layout.md`.
2. **The frame is a real bordered View** with white background and 2px of
   padding. That little padding is the "lift" — it shows the accent fill
   inset inside the frame.
3. **No shadow anywhere.** The frame border is the entire visual weight.

## Section title

```ts
sectionTitle: {
  ...typography.bold,
  marginBottom: 10,
  marginLeft: 6,
  fontSize: 11,
  color: "#000000",
  letterSpacing: 0,
},
```

Small, dark, slightly inset. Doesn't compete with the card it labels.

## Header pills (top of TabScreen)

Round white pills with the soft border, no shadow:

```ts
{
  minHeight: 34,
  paddingHorizontal: 9,        // or width:34/height:34 for icon buttons
  borderRadius: 17,
  borderWidth: 1,
  borderColor: "rgba(0,0,0,0.12)",
  backgroundColor: "#FFFFFF",
  flexDirection: "row",
  alignItems: "center",
  gap: 5,
}
```

The avatar pill keeps the same shape but with a pastel fill instead of
white.

## What to migrate when applying this to other pages

Search-and-replace pass per file:

1. `borderColor: "#000000"` → `borderColor: "rgba(0,0,0,0.12)"`
2. `borderWidth: 2` (paired with the line above) → `borderWidth: 1`
3. `borderWidth: 1.5` (paired with `#000000`) → `borderWidth: 1`
4. Strip `shadowColor` / `shadowOpacity` / `shadowRadius` /
   `shadowOffset` / `elevation` from rendered styles. Keep them on
   transient drag/lift states only.
5. Replace `LinearGradient` / `ExpoGradient` blocks with a single
   `backgroundColor`. Pick the lightest stop from the existing colors
   array. Delete the now-dead gradient import and any "glow blob"
   overlay.
6. Remove orphan styles left over from the prior look (hero blocks,
   action-card blocks, anything not referenced in JSX).

After the pass, the page should read as: pastel fills + soft hairline
frames + flat surfaces. No drama.
