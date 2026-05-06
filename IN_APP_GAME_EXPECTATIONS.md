# In-App Game Experience Expectations

These are mandatory expectations for any in-app game in The Vault.

## Platform context

**The Vault is a React Native (Expo) app designed first and foremost for iOS phones.** Every layout in this doc must be verified on iOS device sizes from iPhone SE (small) through iPhone 16 Pro Max (tall) before being considered done. Android is secondary; web is not a target.

iOS-specific rules of thumb that apply across this doc:

- Use `react-native-safe-area-context`. Wrap each screen in `SafeAreaView` with `edges={["top","bottom"]}` and let it own the safe-area insets. **Do not also call `useSafeAreaInsets()` and add `paddingTop: insets.top` inside that SafeAreaView** — that double-pads on every iPhone (the home-indicator side alone is ~34pt, the notch side ~50pt) and is the most common reason a layout looks "bunched up".
- Default to a `ScrollView` with `contentContainerStyle={{ flexGrow: 1 }}` for any landing/home screen. Use weighted flex sections inside so the page fills tall iPhones, but content scrolls gracefully on iPhone SE rather than clipping.
- Give hero / centerpiece blocks a `minHeight` so they don't crush on shorter devices when surrounded by flex siblings.
- Prefer `marginHorizontal` between row siblings over `gap` for `Pressable` rows with mixed Text+Icon children — see `docs/react-native-pressable-layout.md`.
- Use `KeyboardAvoidingView` with `behavior="padding"` only on iOS (`Platform.OS === "ios" ? "padding" : undefined`); the Android default is correct.
- `hitSlop` of at least 6-8pt on any control under ~44pt — Apple's HIG minimum target.
- Test by physically resizing in the simulator (Cmd+1/2/3) — do not assume "looks fine on iPhone 14 Pro" generalizes downward.

## Experience Goal

- The game must feel like a standalone app experience, not a tab subsection.
- Once launched, users should feel they are fully inside the game world.

## Required Flow

1. In-app game tile tapped from `games-in-app`.
2. Full-screen loading screen appears immediately.
3. Loading transitions to a full-screen game landing page.
4. Landing page includes:
   - centered game name + game-specific logo mark
   - a primary Play CTA
   - a Leaderboard entry point
   - a Daily Quests panel anchored to a side of the middle band
   - a small Challenges or streak strip
   - Settings access
5. Play enters full-screen gameplay that only shows the game itself.

## Shell / Chrome Rules

- No bottom app tab bar while inside a launched game.
- No parent app container framing (no card/tab-like embedded shell).
- No overarching app overlay/header label like `"Word Ladder"` in gameplay.
- Gameplay should not show non-game systems (tasks/challenges panels) while playing.

## Ads / Economy Rules

- Do not show credit-earning UI before the user watches the first ad.
- Trigger recurring ad breaks every **1 minute 30 seconds** during gameplay.
- Ad break should interrupt briefly, then return to gameplay.

## Spacing & Density (iOS)

The single most common landing-page bug is content getting "bunched up" because a screen tries to fit too much in fixed heights. Rules:

- **Vertical breathing room is not optional.** The hero band must have at least `minHeight: 220` so the logo + title + subtitle + level tag never collapse on iPhone SE.
- **Always provide a scroll fallback.** If the natural height of the bands exceeds the iPhone SE viewport (~520pt of content area after safe areas), the page must scroll, not clip. This means the outer container is a `ScrollView`, not a fixed-flex `View`.
- **One source of truth for safe-area padding.** `SafeAreaView` owns the inset; inner containers add small fixed padding (e.g. 8pt) on top of that, never `insets.top`/`insets.bottom`.
- **Tap targets ≥ 44pt.** Any `Pressable` smaller than 44pt on either axis must declare `hitSlop` to reach 44pt.
- **Buttons get explicit numeric heights.** `height: 56` not `minHeight: 50` — height jitter when wrapped in a flex row with mixed-size siblings is a recurring iOS layout bug.
- **Sibling gaps use `marginHorizontal: 5` on each side, not parent `gap`.** This is the only pattern that has held up reliably across iOS device sizes when one of the siblings is a `Pressable` with text+icon children.

## Alignment Rules (mandatory)

The landing screen must read as a single, deliberate composition. Every block lives on a shared vertical axis with predictable horizontal gutters.

- **Single axis of symmetry.** The logo, game title, level tag, and primary CTA all sit centered on the same vertical line. No drifting titles, no ad-hoc left alignment for the hero.
- **One gutter system.** Use one horizontal padding value (e.g. 24px) for the entire page. Resource pills, hero, side panels, and footer shelf all respect that gutter — nothing breaks the rail.
- **Equal-width siblings.** Resource pills in the header are equal width. Footer shelf icons are equal width. Two-up CTA rows split 50/50. No "almost-equal" widths.
- **Side panel rule.** Daily Quests sit pinned to one side of the middle band (left or right, not both, not centered). The opposite side either holds a paired panel of equal height (Challenges, Streak, Events) or stays empty as breathing space — never a stub button.
- **No floating gaps.** The layout must fill the viewport from safe-area top to safe-area bottom. If content does not naturally reach the bottom, distribute the slack with `justifyContent: "space-between"` or weighted flex sections — do **not** leave the bottom half empty with a scroll fallback.
- **Optical centering.** Where icons sit inside a pill or button, they are optically centered, not mathematically centered against descenders.

## Resource Header Rules (per-game logic)

The top resource shelf is **not** a fixed template. Each game declares which resources are real for that game; only those render.

| Resource | Show when |
| --- | --- |
| Lives / energy + refill timer | Game has a fail/retry loop where playing costs an attempt (Word Ladder, Block Puzzle, Match games). |
| Coins (soft currency) | Game has an in-game shop, hint/booster purchase, or wager input (Blackjack, Roulette, Vault Reels, games with hint-buying). |
| Gems (premium currency) | Game offers premium IAP boosters or skip-timer purchases. |
| Streak / XP / rank points | Game has a progression or streak meter (Word Ladder, daily-puzzle games). |
| Tickets / spins | Game gates entry behind a consumable (tournaments, slot pulls). |

Rules:

- Never show a resource the game cannot actually spend or earn. An empty coin pill on a pure skill game is dead UI.
- Resources render in a **single equal-width row** at the top — typically 2 or 3 pills. Four pills is the cap; cut the least-used one before adding a fourth.
- Each pill carries: icon, value, optional sub-label (timer / cap), and a `+` quick-buy only if that resource is purchasable.
- The plus button must lead somewhere real. No `+` chips on resources without a buy flow.

### Word Ladder reference set

Word Ladder is a pure skill / word game. It uses **Lives** (attempts) and **Streak XP** only. It must **not** show coins, gems, inbox, or offers — none of those are spendable in Word Ladder.

## Footer Shelf Rules

- Only include shelf icons that route to a feature this game actually owns.
- Prohibited stubs: Inbox, Offers, generic "Shop" buttons unless the game has a real inbox / offer / shop surface wired up.
- A 2-icon shelf is fine. Do not pad to 4 just to balance the row — use wider buttons instead.

## Surface Discipline (card chrome rule)

The screen should read as a small number of strong **buttons** sitting on an open canvas — not a stack of nested cards.

- **Only interactive surfaces get chrome.** Buttons, pills, and the resource header own borders, fills, and shadows. Content blocks (quest lists, streak rows, info text) render **transparently** on the canvas — no border, no background fill, no rounded plate.
- **No "tab-of-content" cards.** A Daily Quests block is a label + rows on the canvas, not a bordered panel. The same goes for Streak, Challenges, Events, and stats.
- **Group with type and spacing, not boxes.** Use a small uppercase eyebrow label, generous gutter, and a faint hairline only when separation is genuinely needed.
- **Buttons can keep card-like depth.** That depth is what makes them obviously tappable; spreading the same chrome onto static content kills that contrast.

## Input Rules

- Do not use a custom on-screen keyboard for game input.
- Use native text input / system keyboard behavior.

## Visual Direction

- Color family similarity to The Vault is allowed.
- Layout can diverge from tab pages to better support immersion.
- Prioritize standalone-game feel over app-wide visual consistency.
- Logos must be **composed** marks, not a single Material icon dropped on a circle. At minimum: a thematic glyph + a typographic or geometric supporting layer (badge, plate, stacked rungs, ring, etc.).

## Hyper-Casual Landing Template (Preferred)

Use a classic hyper-casual/puzzle structure, sized to fill the full viewport — no half-empty screens.

1. **Resource + Utility Header (top ~12%)**
   - Equal-width resource pills (per-game logic above). Pills carry chrome.
   - Back button + Settings icon on the row directly below, edge-aligned to the gutter.
2. **Hero Block (next ~26%)**
   - Composed game logo, centered on the page axis.
   - Game title centered directly under the logo, on the same axis.
   - Subtitle / one-liner, centered, max 2 lines.
   - Level tag pill, centered.
3. **Transparent Content Band (next ~26%)**
   - Daily Quests pinned to one side, sibling block (Streak / Challenges / Events) on the other.
   - **Transparent — no border, no background fill, no rounded plate.** Just an uppercase eyebrow label, the rows underneath, and gutter-driven spacing.
   - Sits **directly above** the action band so the user reads "what's available today" before they tap Play.
4. **Action Band (next ~16%)**
   - Primary Play CTA — the visually heaviest button on the page. Full-bleed within gutter, or 2/3 width paired with a 1/3 secondary (Leaderboard / Rank).
   - This is the only thing on this row. Nothing competing.
5. **Footer Shelf (bottom ~12%)**
   - 2-3 game-relevant shelf buttons. Equal width. No stubs.

The five bands together must sum to 100% of the viewport between the safe-area insets. Use a flex layout with weighted sections so the screen always feels filled, on every device size.

**Reading order rule:** Resources → identity (logo + title) → today's hooks (transparent content) → primary action → utility shelf. The Play button is the final element before the footer because it's the one decision the user is here to make.

Additional layout behavior:

- Strong vertical hierarchy with immediate readability.
- Heavy tactile depth (drop shadows + pressable surfaces).
- Symmetrical, stable composition around the vertical axis.
- Distinct grouping between menu/home layers and gameplay layers.

## Word Ladder Scope

- Word Ladder gameplay should be a **single ladder level** made of the 8 ladder words.
- Do not convert gameplay into an infinite-level progression for this build.
- Resources for Word Ladder: **Lives + Streak XP only** (no coins, gems, inbox, offers).
