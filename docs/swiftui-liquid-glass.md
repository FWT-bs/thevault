# SwiftUI + Liquid Glass

The Vault renders real SwiftUI surfaces on iOS 26+ via [`@expo/ui`](https://docs.expo.dev/versions/v55.0.0/sdk/ui/swift-ui/). The iOS 26 `.glassEffect()` modifier is what gives buttons, pills, and cards the Liquid Glass material — not a `BlurView` approximation.

## Where it lives

- `app/swift-ui-demo.ios.tsx` — full-page Liquid Glass showcase: hero card, morphing resource pills inside `GlassEffectContainer`, `glassProminent` and `glass` button styles, and a tinted glass surface.
- `app/swift-ui-demo.tsx` — non-iOS fallback message.
- `components/LiquidGlassCard.ios.tsx` — reusable SwiftUI-backed glass card. RN children render through `RNHostView`, so existing `<Text>`, `<Pressable>`, etc. compose on top of native glass.
- `components/LiquidGlassCard.tsx` — non-iOS fallback that delegates to the existing `BlurView`-based `GlassSurface`.

Metro picks the right file by extension automatically; just `import { LiquidGlassCard } from "../components"`.

## Required setup

`@expo/ui` ships native code, so **Expo Go cannot render it**. You need a dev build.

1. Install the build-properties plugin (already wired into `app.json`):

   ```bash
   npx expo install expo-build-properties
   ```

2. Generate the native projects and run a dev build:

   ```bash
   npx expo prebuild --platform ios --clean
   npx expo run:ios
   ```

   The first build takes a few minutes. After that, JS reloads work as normal — you don't need to rebuild for JS-only changes.

3. Subsequent dev sessions: `npx expo start --dev-client`.

## Constraints

- **iOS 26 only.** `.glassEffect()` is iOS 26+. `app.json` sets the deployment target to `26.0`, which drops support for iOS 25 and earlier devices.
- **iOS-only features.** Anything in `@expo/ui/swift-ui` is iOS. Android falls back to the RN `GlassSurface`/`GlassButton` BlurView components.
- **Don't mix concerns.** A SwiftUI tree must be wrapped in `<Host>`. RN content inside that tree needs `<RNHostView>`. Avoid stacking RN and SwiftUI views with `position: absolute` to fake glass over native content — use `LiquidGlassCard` instead.

## Patterns

### Glass card with RN children

```tsx
import { LiquidGlassCard } from "../components";

<LiquidGlassCard tint="#7DD3FC" cornerRadius={28}>
  <Text style={typography.bold}>Wallet</Text>
  <Text>$1,240.18</Text>
</LiquidGlassCard>
```

### Pure SwiftUI surface

```tsx
import { Host, VStack, Text } from "@expo/ui/swift-ui";
import { glassEffect, padding, font } from "@expo/ui/swift-ui/modifiers";

<Host matchContents>
  <VStack
    modifiers={[
      glassEffect({
        glass: { variant: "regular", interactive: true },
        shape: "roundedRectangle",
        cornerRadius: 24,
      }),
      padding({ all: 16 }),
    ]}
  >
    <Text modifiers={[font({ size: 22, weight: "bold" })]}>Hello, glass</Text>
  </VStack>
</Host>;
```

### Morphing pills

Wrap adjacent glass views in `<GlassEffectContainer>` so the material blends fluidly when they sit close together — see the resource pills row in `swift-ui-demo.ios.tsx`.

## Tip for local development

`.glassEffect()` only *looks* like glass when there's tinted content underneath it. Put a gradient (or a colorful image) behind your `Host`, otherwise on a flat white canvas the surface reads as a faint outline.
