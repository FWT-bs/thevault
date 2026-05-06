# Daily Streak Redesign

Implements `Vault - Daily Streak Popup.html` from the Claude Design handoff
bundle (downloaded `2026-05-06`) plus the four follow-up changes the user
asked for in chat.

## Source

- Design URL: `https://api.anthropic.com/v1/design/h/Y6E1J1gyh3sivWE9x8YXCg?open_file=Vault+-+Daily+Streak+Popup.html`
- Primary file: `vault/project/Vault - Daily Streak Popup.html`
- The actual screen lives in `vault/project/components/streak-popup.jsx`
  (`StreakPopup` component, ~355 lines).
- Chat transcript that introduced the popup: `vault/chats/chat2.md` —
  message starting "can you design json or html animations for…".

## User asks (reproduced verbatim, then mapped)

1. *"when i press claim it should go to the page it just had"* — pressing
   **Claim** on the home card now opens the new fullscreen streak popup.
2. *"remove the small fire.json and checkmark.json thing, and instead
   increase the size of the 7 day calendar"* — the 44×44 lottie circle
   beside the calendar is gone; the calendar fills the card width, with
   chips bumped from `paddingY: 6 / fontSize 9–12 / minHeight ~36` to
   `paddingY: 14 / fontSize 11–17 / minHeight 64`.
3. *"after i press continue on the new page it should make the claimed
   button actually a light green to show that its claimed"* — Continue
   sets a shared `streakClaim` flag and pops back to home; the Claim pill
   re-renders with `#D9F2E0` fill, `#7CC692` border, `#0F7A2E` "Claimed"
   label + checkmark; today's calendar chip mirrors the same green state.
4. *"can you make the fire on this new page also be less of just 3 leaf
   like shapes but actually have flames and edges and like a more burning
   like fire"* — the design's three smooth almond paths were redrawn. See
   "Fire path notes" below.

## New / modified files

| File | Role |
| --- | --- |
| `app/streak-claim.tsx` | New fullscreen route. Animated SVG fire (3 layered paths + core glow + flicker), drifting embers, count-up reward chip, coin fountain spawning from the fire core, white Continue CTA. |
| `lib/streakClaim.ts` | Tiny module-level store with subscribe/notify so the popup can mark "claimed" before navigating back and the home tab re-renders via `useSyncExternalStore`. |
| `app/home.tsx` | Removed the inline `Fire.json` / `checkmark.json` `LottieView`s. Calendar now spans the full card width with bigger chips. Claim button routes to `/streak-claim` and shows the green Claimed state when the store flag flips. |
| `app/_layout.tsx` | Registered the `streak-claim` Stack.Screen as a modal presentation with a black `contentStyle` so the dark canvas extends behind the safe-area on iOS. |

`assets/Fire.json` and `assets/checkmark.json` are NOT deleted — they're
still imported by `app/redeem.tsx`, `app/word-ladder.tsx`, and
`components/AdGateModal.tsx`.

## Flow

```
Home tab
  ┌── 7-day calendar (full width, big chips)
  └── [Claim now]  ──► push("/streak-claim")
                          │
                          │  fullscreen popup
                          │  • burning fire + day-7 number
                          │  • count-up "+25 CR"
                          │  • Continue
                          │
                          ▼  streakClaim.setClaimed(true)
                              router.back()
Home tab (re-rendered)
  ┌── today's chip is light green w/ checkmark
  └── [✓ Claimed] (light green pill)
```

## Mapping — design → RN

| Source (HTML/JSX) | RN port |
| --- | --- |
| `StreakPopup` component | `app/streak-claim.tsx`. |
| 3-layer SVG fire (`flameOuter`, `flameMid`, `flameInner` linear gradients + `coreGlow` radial) | Same gradients, redrawn `<Path d>` with serrated crowns (see notes). |
| `@keyframes sp-flame-outer/mid/inner` (CSS skew/scale flicker) | `MotiView` flicker overlays at 850ms / 550ms with `repeatReverse: true`. The SVG paths themselves don't morph — animating bezier `d` strings on RN-SVG every frame is too costly; the layered opacity + glow flicker reads the same. |
| `@keyframes sp-glow` halo behind fire | `MotiView` scaling between 1 → 1.06, 1.8s ping-pong. |
| 18 drifting `sp-ember` particles | `<Embers>` component, same 18 count, same color triplet, animated with Moti `translateY` to `-screenHeight`. |
| Count-up `displayAmount` (cubic ease-out, 1.2s, 0.7s delay) | Same logic with `requestAnimationFrame`. |
| Coin spawner (initial 6 burst @ 140ms, then 600ms trickle for 6s) | Identical timing in `<CoinFountain>`. CSS `--x` variable replaced with `xJitter` prop driving Moti `translateX`. |
| Reward chip with gradient backplate + glass blur | Solid `rgba(255,150,55,0.16)` fill with shadow — RN doesn't have a free `backdrop-filter`; the design's chip is small enough that a flat alpha reads identical against the black backdrop. |
| White CTA `Continue` (`box-shadow 0 12px 28px -10px white/0.4`) | `shadowColor: #fff`, `shadowOpacity: 0.4`, `shadowRadius: 28`, offset `(0, 12)`. |
| `onContinue` resets the popup (`setKey(k=>k+1)`) | `onContinue` flips the store flag and pops back to home — that was the whole point of the user's first request. |

## Fire path notes

The user explicitly called out the design's fire as "3 leaf like shapes".
The cause is structural: each `<path>` in the source uses two cubic
beziers that meet at a single tip — that draws a smooth almond.

Replacement strategy:

- **Outer flame**: split into a central tongue plus two side lick branches
  off the same path (`M 120 18 … C … C … C … C …`). The path now has three
  visible peaks at the crown (left, center, right) and a wider base.
- **Mid flame**: same crowned silhouette, scaled inward, so the outline
  shows tongue separations even when overlaid.
- **Inner flame**: kept as a tighter ribbon but with a stepped curve that
  reads as a single vertical lick rather than another almond.
- **Core glow**: unchanged from the design (radial behind the streak
  number).

The result is a flame silhouette with multiple peaks and edges instead of
three nested almonds. Animation continues to come from the layered
flicker overlays — the underlying paths are static, which keeps SVG
re-render cost flat.

## Why a module store and not router params

Expo Router params are strings and re-trigger the home screen as a fresh
mount. We just need a one-bit "did claim" signal that survives a single
back navigation, and the home tab needs to re-render *in place*.
`useSyncExternalStore` over a 20-line module-level store is the smallest
correct shape for that.

The flag intentionally does not persist across reloads — a real "daily"
claim lives server-side, and persisting locally would just lie to the UI
once the date rolls over.

## Verification

- `npx tsc --noEmit` — clean (exit 0).
- The existing references to `Fire.json` and `checkmark.json` in
  `redeem.tsx`, `word-ladder.tsx`, and `AdGateModal.tsx` are untouched.
