# The Vault Mobile Game UI Prompt

Use this prompt when designing or building any new mobile game screen for The Vault. Match the existing app UI as closely as possible: bright liquid-glass surfaces, thick black arcade outlines, soft sky-blue gradients, pill controls, rounded tiles, springy motion, and clean native typography.

## Core Style

Design a portrait mobile UI for a playful casino/arcade rewards app called **The Vault**. The interface should feel like a polished mobile game lobby mixed with a modern wallet app: bright, tactile, glossy, friendly, and energetic, but still clean enough for real-money/account flows.

The design language is **liquid glass arcade**:

- White and pale sky-blue canvas.
- Frosted translucent cards layered over blur.
- Thick black outer strokes on important cards and buttons.
- Rounded, toy-like geometry with high radii.
- Compact game metadata, chips, icons, and credit/payout values.
- Sky/cobalt accents with small copper/orange, oxblood, mustard, and moss status colors.
- Subtle shadows and highlights that make components feel physical.

Do not make the UI dark neon, cyberpunk, generic casino red/black/gold, or plain corporate fintech. Keep it bright, sky-tinted, glassy, outlined, and mobile-first.

## Color Palette

Use these exact colors as the base design tokens:

```text
Ink / primary text:        #1A1A1F
Soft ink:                  rgba(26,26,31,0.76)
Muted ink:                 rgba(26,26,31,0.58)
Faint ink:                 rgba(26,26,31,0.36)

White surface:             #FFFFFF
Pearl surface:             #F7FCFF
Canvas sky:                #EFF8FF
Canvas deep sky:           #E0F2FE

Primary sky light:         #BAE6FD
Primary sky:               #7DD3FC
Primary sky deep:          #38BDF8
Extra button sky:          #8FD9FB
Claim-button sky:          #A9E5FF

Legacy cobalt:             #090C9B
Royal blue:                #3D52D5
Mist blue:                 #B4C5E4
Ivory:                     #FBFFF1
Eggplant:                  #3C3744

Copper light:              #FFB347
Copper:                    #FF7A00
Copper deep:               #FF4D00

Oxblood light:             #B14A52
Oxblood:                   #7A1E2C
Oxblood deep:              #4D1019

Mustard light:             #E8C547
Mustard:                   #C9A227
Mustard deep:              #8E6E13

Success moss:              #4A6B5C
Charcoal shadow:           #1C1E22
```

Use these translucent glass colors:

```text
Frost light:               rgba(253,251,246,0.38)
Frost:                     rgba(253,251,246,0.56)
Frost deep:                rgba(253,251,246,0.74)
Highlight:                 rgba(253,251,246,0.58)
Strong highlight:          rgba(253,251,246,0.9)
Light edge:                rgba(253,251,246,0.6)
Soft edge:                 rgba(253,251,246,0.32)
Ink edge:                  rgba(26,26,31,0.1)
Ink shadow:                rgba(28,30,34,0.22)
Sky shadow:                rgba(56,189,248,0.22)
```

## Gradients

Keep gradients inside one hue family. Avoid rainbow gradients.

Light glass surface:

```text
rgba(240,249,255,0.78)
rgba(232,245,255,0.68)
rgba(224,242,254,0.62)
```

Oceanic/cobalt glass surface:

```text
rgba(186,230,253,0.38)
rgba(167,222,251,0.34)
rgba(125,211,252,0.32)
```

Hero card sky gradient:

```text
#E0F2FE
#BAE6FD
#8FD9FB
```

Dark feature card:

```text
rgba(42,45,52,0.9)
rgba(28,30,34,0.88)
rgba(18,20,24,0.84)
```

Use soft radial blobs only as background atmosphere: large low-opacity sky, mint, and mustard/cobalt circles positioned partly offscreen. They should feel like light passing through glass, not decorative confetti.

## Typography

Use native system sans-serif typography:

```text
iOS: SF Pro Text
Android: System / Roboto
Web: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", system-ui, "Segoe UI", Roboto, sans-serif
```

Type should be bold, compact, and readable:

- Main screen title: 31px, line-height 36, bold, letter-spacing -0.9.
- Hero game title: 26-32px, bold, tight line-height, letter-spacing around -0.6 to -0.9.
- Card titles: 17-20px, bold, slight negative tracking.
- Body/subtext: 12-14px, regular or semibold, line-height 17-19.
- Section labels and metadata: 9-11px, bold or semibold. Use uppercase-style letter spacing only for tiny metadata, not for normal labels.
- Buttons: 13-17px, bold or semibold, centered, tight tracking.

Use black text on light/sky surfaces. Use ivory `#FDFBF6` on dark glass.

## Mobile Layout

Build screens as full-height portrait mobile pages with safe-area support.

Global layout:

- Background: default white `#FFFFFF`, optionally with pale sky gradient/blobs.
- Horizontal screen padding: 24px.
- Top content padding: about 8px after safe area.
- Header row: title/subtitle on the left, optional compact action pills on the right.
- Header bottom margin: 24px.
- Scroll content bottom padding must leave room for a floating tab bar: tab bar height 60px plus safe-area bottom plus 32px.
- Hide vertical scroll indicators.

Screen composition:

- Start with a high-impact hero card or account/balance card.
- Follow with small horizontal stat/action tiles.
- Use grouped list cards for rows.
- Keep vertical rhythm varied: 12px between list rows, 16-18px between related sections, 22-26px before major group changes.
- Use two-column feature/stat cards with 10-12px gaps.
- Use row cards for game lists: icon tile on left, title/meta in center, payout/status on right.

## Shapes And Components

Use highly rounded shapes everywhere:

- Floating tab bar: 60px tall, radius 30, horizontal margin 24.
- Hero cards: radius 28-30, 2px black border.
- Standard glass cards: radius 22-24, 2px black border for major surfaces.
- Stat tiles: radius 18-20, 2px black border.
- Icon tiles: 30-62px square, radius 10-22.
- Buttons: pill radius 20-29 or 999 for capsule pills.
- Chips/badges: pill radius 999.
- Bottom sheet: top radii 32px.

Important surfaces should have a bold black outline:

```text
borderWidth: 2
borderColor: #000000
```

Secondary inner glass edges can use hairline borders with translucent ivory or ink.

## Liquid Glass Surface Recipe

Every glass card should feel like a stack:

1. Outer shadow: charcoal, soft, downward.
2. Rounded clipping container.
3. `BlurView` behind the content.
4. Translucent single-hue gradient overlay.
5. Soft top highlight gradient.
6. Thin specular highlight line near the top.
7. Content padding.

Default light glass:

- Radius: 22-24.
- Blur intensity: 28-38.
- Padding: 14-18.
- Shadow opacity: about 0.22.
- Shadow radius: 24.
- Shadow offset: 0, 12.

Dark glass:

- Use charcoal gradient.
- Ivory text.
- Blur intensity: 50-60.
- Border/highlights in low-opacity ivory.
- Shadow opacity around 0.45.

## Buttons And Controls

Primary CTA style:

- Sky-blue or white pill.
- 2px black border for the most important game actions.
- Height 42-58 depending on importance.
- Center content with icon + label.
- Use black text on sky/white buttons.
- Use `#FFFFFF` or `#FDFBF6` text on ink/orange buttons.
- Pressed state scales down to about `0.965-0.975` or lowers opacity to `0.9-0.92`.

Game/action chips:

- Active category chip: `#8FD9FB`, black border, radius 20, 9px vertical padding, 16px horizontal padding.
- Inactive chip: translucent ivory/sky, black border 1.5px, radius 20.
- Hot chip: oxblood tint background `rgba(122,30,44,0.14)`, hairline oxblood border, tiny flame icon.
- Reward chip: sky tint background `rgba(56,189,248,0.18)`, sky border, deep sky text.

## Navigation

Use a floating liquid-glass bottom tab bar:

- Position absolute at bottom.
- Left/right margin: 24px.
- Height: 60px.
- Bottom offset: max(safe-area bottom, 16px).
- Full pill radius: 30px.
- Background is a real blur with subtle white vertical gradient.
- Add top 1px white specular highlight and faint bottom edge.
- Add two shadow layers: one broad shadow and one tighter contact shadow.
- Active tab has a moving translucent blob/lens under it.
- Active icon color: `#38BDF8`; inactive icon color: `#7DD3FC`.
- Active label color may use cobalt `#090C9B`; inactive label uses eggplant `#3C3744`.

Tab motion:

- The active blob slides horizontally with a spring.
- Active tab icon/label scales to about 1.05.
- The active blob briefly stretches on the Y axis, then springs back.

## Game Cards

For game selection screens:

- Put category pills at top.
- Add one dark or rich glass tournament/featured card near the top.
- List games as frosted rounded rows with black border.
- Each row includes:
  - 54x54 rounded icon tile with sky gradient.
  - Game name in 17px bold.
  - Game tag and live-player count in 12px muted text.
  - Optional hot chip beside title.
  - Payout value right-aligned in 15px bold deep sky.
  - Tiny "Payout" label in 9px semibold with letter spacing.

For featured hero cards:

- Use a 28px radius card with 2px black border.
- Use a pale sky diagonal gradient.
- Include a large translucent white orb partly off the top/right edge.
- Layout: text column left, icon tile right.
- Badge at top left, title/subtitle below.
- Dots and play button anchored near the bottom.
- Play button is a white pill with black border and subtle shadow.

## Wallet And Reward Patterns

Balances and high-value game reward states can use dark glass:

- Dark charcoal/cobalt card, radius 30, 2px black outer border.
- Huge numeric value, 48px bold, ivory.
- Tiny metadata in ivory at 60-75% opacity.
- Inline activity graph with sky gradient stroke and faint fill.
- Action buttons in a two-column row.

Positive values use moss `#4A6B5C`. Negative or danger values use oxblood `#7A1E2C`. Bonuses use mustard `#C9A227`.

## Animation And Motion

Use motion generously but keep it smooth and mobile-native.

Entrances:

- Screen wrapper: fade in from opacity 0 and translateY 10 over 260ms.
- Major hero cards: fade in from opacity 0 and translateY 12-14 over 520ms.
- Lists: stagger each row by 60ms, starting around 80ms, duration about 420ms.

Press states:

- Glass surfaces: spring scale to 0.975.
- Buttons: spring scale to 0.965, disabled opacity around 0.45.
- Simple press feedback can also use opacity 0.9-0.92.

Spring defaults:

```text
damping: 18
stiffness: 320
```

Tab spring:

```text
damping: 18
stiffness: 200
mass: 0.9
```

Drag/reorder mode:

- Long press after about 420ms enters editing.
- Cards wobble gently out of phase from -0.8deg to 0.8deg.
- Dragged card scales to 1.03, opacity 0.96, and receives a stronger shadow.
- Sibling cards shift with a spring to preview the drop target.

Reward feedback:

- Use Lottie for a fire streak and a checkmark confirmation.
- Floating reward bubble should start visible, move up about 34px, and fade out over about 820ms.
- Checkmark can pop with scale overshoot.
- Loading spinner is a cobalt/sky stroked trim-path rotation.

Bottom sheet/modal motion:

- Backdrop fades in over 180ms.
- Sheet slides up from the bottom over 240ms.
- Sheet has radius 32 on top corners, blur, and sky gradient.

## Icons And Visual Motifs

Use `Ionicons` and `MaterialCommunityIcons` with rounded game-like icons:

- Gamepad, cards, dice, trophy, flame, sparkles, wallet, person, lock, shield, diamond, trending, gift, arrow-forward.
- Icons usually sit inside rounded square tiles with translucent sky/ivory fills.
- Important icon tiles have black borders; secondary icon tiles use hairline translucent borders.

Use Lottie animations sparingly for meaningful moments: fire streaks, checkmarks, loading, reward completion.

## Do And Do Not

Do:

- Keep the UI bright, rounded, outlined, and glassy.
- Use sky/cobalt as the dominant accent.
- Use thick black outlines on important interactive surfaces.
- Use pill chips for categories, badges, and tiny rewards.
- Use blur, translucent gradients, specular highlights, and soft shadows.
- Use staggered reveals and springy press states.
- Keep all screens portrait-first and thumb-friendly.

Do not:

- Use generic dark casino styling.
- Use red/black/gold as the core palette.
- Use rainbow gradients or neon glow everywhere.
- Use square cards or sharp corners.
- Use flat gray corporate UI.
- Replace the floating liquid-glass tab bar with a normal system tab bar.
- Overuse all-caps labels. Reserve tracking for tiny metadata.

## Example Screen Prompt

Create a new mobile game screen for The Vault using the existing liquid-glass arcade design system. Use a white/sky canvas, frosted glass cards, thick black outlines, rounded pill controls, sky-blue accents, compact native typography, and springy Moti-style animations. Include a top header with a 31px bold title and semibold subtitle, a large 28-30px radius featured game card with a pale sky gradient and black border, category pills, a list of rounded game/reward rows, and the floating liquid-glass bottom tab bar. Use exact colors from this document, especially `#1A1A1F`, `#FFFFFF`, `#EFF8FF`, `#E0F2FE`, `#BAE6FD`, `#7DD3FC`, `#38BDF8`, `#8FD9FB`, `#FF7A00`, `#7A1E2C`, `#C9A227`, and `#4A6B5C`. Animate the screen in with fade/translateY, stagger list rows, scale buttons on press, and use Lottie only for meaningful reward/check/streak moments.
