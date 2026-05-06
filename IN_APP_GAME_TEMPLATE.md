# In-App Game Template — Implementation Notes

This doc tracks the port of `Vault - In-App Game.html` (Claude Design handoff
bundle, downloaded `2026-05-06`) into the `thevault-main` Expo / React Native
codebase.

## Source

- Design URL: `https://api.anthropic.com/v1/design/h/jq0-0CgqqRuV13XbFw5jgA?open_file=Vault+-+In-App+Game.html`
- Bundle README pointed at `vault/project/Vault - In-App Game.html` as the
  primary file.
- `Vault - In-App Game.html` is the host page; the actual screens live in
  `vault/project/components/game-templates.jsx` (`GameLoader`, `GameLanding`,
  and the `GAME_CONFIGS` object).
- Two chat transcripts captured the iteration. `chat2.md` is the most recent
  rework — it relocated the title from a top tab to a big centered header,
  introduced the `[mode pills → big Play → 3 pill actions]` stack, and moved
  daily tasks to a small middle-left side tab.

## What was implemented

A reusable, config-driven loading screen + lobby template that drops into any
in-app game. The HTML mock rendered both screens side-by-side inside two
fake iPhone frames; on iOS those map to a single-screen flow with a stage
crossfade.

### New files

| File | Role |
| --- | --- |
| `constants/gameTemplates.ts` | `GameConfig` schema, color tokens (`GT.*`), and three sample configs (`blackjack`, `slots`, `puzzle`) — 1:1 port of the design's `GAME_CONFIGS`. |
| `components/v2/GameArt.tsx` | `react-native-svg` port of the four `ART.*` SVG illustrations (blackjack, slots, puzzle, generic). |
| `components/v2/GameLoader.tsx` | Loading screen: hero plate, pulsing accent ring (Moti), accent-soft backdrop, non-linear progress (60ms tick, `step = max(0.4, (100-p)*0.06)`), 2.4s tip carousel. |
| `components/v2/GameLanding.tsx` | Lobby per chat2 spec: streak chip top bar, big 54pt centered title, hero art halo, mode pill row, full-bleed Play CTA, three `[Leaderboard, Stats, Settings]` glass pills, side-tab `Tasks` opening a bottom-sheet `Modal`. |
| `app/game-template.tsx` | Host route — switcher (Blackjack / Slots / Block Puzzle) plus loader → landing crossfade. Pressing `Play` on the blackjack config routes into the existing `/blackjack` gameplay. |

### Modified files

| File | Change |
| --- | --- |
| `app/_layout.tsx` | Registered the new `game-template` Stack.Screen with `animation: "fade"`. |

## How to view it

The route is registered under `expo-router` at `/game-template`. Push to it
from anywhere in the app, e.g.:

```ts
router.push("/game-template");
```

The switcher pinned to the top of the screen (mirrors the `.switcher` element
in the source HTML) toggles between game configs without leaving the host.

## Mapping to the design

| Source (HTML/JSX) | Implementation (RN) |
| --- | --- |
| Inline `<style>` tokens (`GT.bg`, `GT.cyan`, `GT.amber`, etc.) | `constants/gameTemplates.ts` — `GT` object exported. |
| `GAME_CONFIGS` object | Same shape, typed as `Record<string, GameConfig>`. `tag` constrained to `"HOT" \| "LIVE" \| "NEW" \| "FAST"`. |
| `ART.*` SVG components | `components/v2/GameArt.tsx`. Uses `react-native-svg` primitives; viewBox preserved (`0 0 200 160`). |
| `<GCard/>` atom | Inlined into the loader's progress card. The lobby has no card chrome — content sits on the canvas as the layout requires. |
| CSS keyframes `gl-pulse` | Moti `from→animate` with `loop: true, repeatReverse: true`, ~1.1s per direction. |
| CSS keyframe `gl-fadein` (tip swap) | Moti, keyed by `tipIdx` so each new tip mounts fresh. |
| `backdrop-filter: blur(...)` glass tile | Solid `rgba(255,255,255,0.86)` panels with iOS shadows — RN doesn't have a free `backdrop-filter`; using `expo-blur` here was overkill for the content density. |
| Tasks overlay (`gl-slideup`) | Native `Modal` (`statusBarTranslucent`, `transparent`) with a Moti slide-up sheet plus a tappable scrim. |
| Two side-by-side phone frames in the host | Single full-screen flow + crossfade — phone frames are a desktop-preview affordance, not a mobile pattern. |

## Layout numbers preserved

These dimensions came directly from the JSX and were kept verbatim:

- Loader hero plate: `240×180`, `borderRadius: 32`, plate inner padding `18`.
- Pulse ring inset `-12`, border `1.5`.
- Loader progress track: `height: 6`, `borderRadius: 3`.
- Lobby title: `fontSize: 54`, `letterSpacing: -2.2`, `lineHeight: 56`.
- Lobby Play CTA: `height: 64`, `borderRadius: 32`.
- Action pills: `borderRadius: 18`, icon plate `34×34` `borderRadius: 11`.
- Tasks side-tab: anchored `top: 46%`, right-rounded `14`, glyph `28×28`.
- Tasks sheet: `left/right 14`, `bottom: 24`, `borderRadius: 24`.

## Deviations / tradeoffs

- `IN_APP_GAME_EXPECTATIONS.md` describes a 5-band "hyper-casual" landing
  layout (resource pills → hero → transparent quests → action → footer
  shelf). The design file lands on a different composition (centered hero,
  side-tab tasks, no resource pills). I implemented the design as
  delivered, since the user specifically said "Implement Vault - In-App
  Game.html". The existing `app/blackjack.tsx` still follows the
  expectations doc and is left untouched.
- The host route is a preview affordance. Real games (e.g. blackjack)
  already have their own bespoke loader + landing in `app/blackjack.tsx`.
  Pressing Play in the blackjack config routes into that gameplay so the
  template isn't a dead end.
- `expo-blur` is available in this project but the design's translucent
  panels render fine with solid alpha fills against the `#FAFAF7` canvas;
  adding live blur would cost frame time without clear visual win at this
  density.

## Verification

- `npx tsc --noEmit` — clean (exit 0).
- The `Vault - Liquid Glass v2.html` already in the repo root and the design
  bundle's other HTML files were not touched.
