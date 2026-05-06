# HeroGlassButton

A Liquid Glass capsule CTA used for primary actions across the app: **Earn more** (wallet), **Play Now / See More** (home), and the **Next / Get Started** tutorial CTA. iOS uses Apple's actual `.glassEffect()` material via `@expo/ui`; other platforms get a BlurView + tint approximation with the same shape and feel.

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `label` | `string` | — | Button text |
| `icon` | Ionicons name | — | Optional leading icon |
| `tint` | hex string | `undefined` | Color shown through the glass. Omit for clear glass. |
| `tintOpacity` | `0–1` | `0.6` | Cross-platform fallback only; ignored on iOS |
| `size` | `"regular" \| "large"` | `"regular"` | 48pt vs 56pt height |
| `onPress` | `() => void` | — | Tap handler |

```tsx
<HeroGlassButton
  label="Play Now"
  icon="play"
  tint="#7DD3FC"
  size="large"
  onPress={() => router.push("/games-in-app")}
/>
```

## The two files

```
components/
  HeroGlassButton.ios.tsx   ← Apple Liquid Glass via @expo/ui
  HeroGlassButton.tsx       ← BlurView fallback for Android/web
```

Metro auto-resolves by extension. Call sites import the same name and don't care which one they get.

## Architecture

Both files share the same outer structure:

```
<Animated.View>           ← scale transform for press magnify; carries shadow on iOS
  <Pressable>             ← tap target + onPressIn/onPressOut hooks
    <View absoluteFill>   ← glass material layer (SwiftUI on iOS, BlurView elsewhere)
    <View>                ← icon + text content
```

The **scale animation** is identical on both platforms:

```ts
const scale = useRef(new Animated.Value(1)).current;
const animateTo = (toValue: number) =>
  Animated.spring(scale, {
    toValue,
    useNativeDriver: true,
    damping: 14,
    stiffness: 320,
    mass: 0.6,
  }).start();

<Pressable onPressIn={() => animateTo(1.05)} onPressOut={() => animateTo(1)} />
```

Press-in scales the pill UP to `1.05` instead of the typical `0.95` shrink — this matches the iOS 26 nav-bar magnify behavior the user expects on touch.

## iOS implementation

```tsx
<Host matchContents>
  <VStack
    modifiers={[
      glassEffect({
        glass: { variant: "regular", interactive: true, tint },
        shape: "capsule",
      }),
    ]}
  >
    <Spacer />
  </VStack>
</Host>
```

That's it. Apple's `glassEffect(_:in:)` handles:
- The frosted glass material
- The capsule shape (its documented default)
- The rim highlight
- The natural refraction
- The squishy interactive deformation when pressed (from `interactive: true`)

We do *not* layer a BlurView, tint overlay, or rim border on iOS — the SwiftUI material already provides all of that, and stacking RN layers over it produces visual artifacts.

### iOS shadow gotcha (important)

A naive `shadow*` on a transparent View renders as a **square** because iOS Core Animation falls back to layer bounds when there's no defined shape. To get a rounded shadow:

```ts
shadowWrap: {
  backgroundColor: "#FFFFFF",     // gives iOS a defined shape
  borderRadius: minHeight / 2,    // capsule
  shadowColor: "#0A1628",
  shadowOpacity: 0.22,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 6 },
  elevation: 8,
}
```

The white background is **never visible** — the SwiftUI capsule on top has the exact same `shape: "capsule"` and fully covers it. iOS just needs the shape hint to draw the shadow correctly.

## Non-iOS fallback

Approximates the same look with primitives that exist everywhere:

```
backgroundColor: tint   ← solid color shapes the layer for shadow rendering
  └─ BlurView (intensity 45–70, tint="light")   ← frosted glass effect
  └─ View backgroundColor: tint @ 0.6 opacity   ← color depth
  └─ Hairline white border                       ← glass rim
  └─ icon + text content
```

Same capsule radius (`minHeight / 2`), same scale animation, same shadow values as iOS. The shadow lives directly on the Pressable here because we set its `backgroundColor` to `tint` — that gives the layer a defined rounded shape for shadow computation, no separate wrapper needed.

## How to replicate from scratch

### Recipe (iOS, with @expo/ui)

1. **Install** `@expo/ui` (already in this repo). Requires a dev build with iOS 26 deployment target — `Expo Go cannot render it`.

2. **Outer wrapper** — `Animated.View` with the press-scale transform. Set `backgroundColor: "#FFFFFF"`, `borderRadius: capsuleRadius`, plus your shadow props. This is the white-bg-shadow trick from above.

3. **Pressable inside** — `flex: 1`, `overflow: "hidden"`, same `borderRadius`. Wire `onPressIn`/`onPressOut` to `Animated.spring` between `1` and `1.05`.

4. **SwiftUI glass layer** — absolute-fill View containing `<Host matchContents><VStack modifiers={[glassEffect({ glass: { variant, interactive, tint }, shape: "capsule" })]}><Spacer /></VStack></Host>`. The `Spacer` is just there to give the VStack content; the `glassEffect` modifier provides the entire visual.

5. **Content layer** — sibling `<View pointerEvents="none">` with row-flex icon + label, centered, with horizontal padding around 18pt.

That's the full iOS recipe. ~85 lines including types and styles.

### Recipe (cross-platform, no SwiftUI)

1. Same Animated.View + scale animation as above.

2. Pressable with **`backgroundColor: tint`**, `borderRadius: minHeight / 2`, shadow on this same layer (don't split shadow off — the colored bg shapes the shadow).

3. Inside, an absolute-fill `<View overflow:hidden borderRadius:minHeight/2>` containing:
   - `<BlurView intensity={70} tint="light" />` (full fill)
   - `<View backgroundColor: tint, opacity: 0.6 />` (full fill, sets the visible color)

4. Sibling absolute-fill `<View>` with `borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.6)"` for the glass rim.

5. Content layer with icon + text, same as iOS.

## Why not use `LiquidGlassButton`?

`components/LiquidGlassButton.ios.tsx` wraps SwiftUI `Button` + `.buttonStyle(.glassProminent)`. That style applies tint via SwiftUI's native button-tint pipeline, which **heavily desaturates light hues** — `#CFEBFB`, `#A8E1FA`, `#F2FAFF` all rendered nearly white. There's no public API to weaken Apple's frost.

`HeroGlassButton` skips `buttonStyle` and applies `.glassEffect()` directly to a layout view. The tint passes through with the saturation we picked, and we use `Pressable` for tap handling — gaining full control over the press animation.

Use `LiquidGlassButton` for places that want Apple's defaults (settings rows, secondary actions). Use `HeroGlassButton` for hero CTAs where the color and the magnify feel matter.

## Tints used in the app

| Color | Where | Visual |
|---|---|---|
| `#7DD3FC` (sky-300) | Earn more, Play Now, tutorial CTA | sky blue |
| `#FFFFFF` | Cash out, See More | clear/white |

Pass any other hex through `tint` to retheme — e.g. `#FFD55E` for a yellow CTA, `#9FE7B5` for green.

## See also

- [`docs/swiftui-liquid-glass.md`](./swiftui-liquid-glass.md) — broader Liquid Glass setup notes
- [`docs/react-native-pressable-layout.md`](./react-native-pressable-layout.md) — why content-flex layout lives on a sibling View, not the Pressable itself
- Apple: [Applying Liquid Glass to custom views](https://developer.apple.com/documentation/swiftui/applying-liquid-glass-to-custom-views)
- Apple: [`glassEffect(_:in:)`](https://developer.apple.com/documentation/swiftui/view/glasseffect(_:in:))
