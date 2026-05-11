import { MaterialCommunityIcons } from "@expo/vector-icons";
import type React from "react";

import { GLASS } from "./glassPalette";

export type CategoryId = "in-app" | "external" | "surveys";
export type GameTone = "cobalt" | "oceanic" | "sunset" | "dark";

export interface GameActivity {
  name: string;
  tag: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  tone: GameTone;
  category: CategoryId;
  players: string;
  payout: string;
  hot?: boolean;
}

export interface FeaturedSlide {
  badge: string;
  title: string;
  subtitle: string;
  categoryLabel: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  tone: GameTone;
  reward: string;
}

export interface CategoryTab {
  id: CategoryId;
  label: string;
  eyebrow: string;
  detail: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  color: string;
  route: "/games-in-app" | "/games-external" | "/offerwall";
}

export const FEATURED_SLIDES: FeaturedSlide[] = [
  {
    badge: "In-app pick",
    title: "Midnight High Roller",
    subtitle: "5k credit pool · 2h left",
    categoryLabel: "Cards",
    icon: "cards-playing-outline",
    tone: "dark",
    reward: "5,000 CR",
  },
  {
    badge: "Fast credits",
    title: "Block Puzzle Rush",
    subtitle: "Short rounds with boosted credits.",
    categoryLabel: "Puzzle",
    icon: "puzzle-outline",
    tone: "oceanic",
    reward: "2.4x",
  },
  {
    badge: "External bonus",
    title: "Partner Game Quest",
    subtitle: "Play partner games, earn here.",
    categoryLabel: "External",
    icon: "rocket-launch-outline",
    tone: "cobalt",
    reward: "+850 CR",
  },
  {
    badge: "Survey spotlight",
    title: "Daily Offer Board",
    subtitle: "Surveys and streak offers.",
    categoryLabel: "Offers",
    icon: "clipboard-text-outline",
    tone: "sunset",
    reward: "+1,200 CR",
  },
];

export const CATEGORY_TABS: CategoryTab[] = [
  {
    id: "in-app",
    label: "In App Games",
    eyebrow: "Play here",
    detail: "Instant rounds and live tables",
    icon: "gamepad-variant-outline",
    color: GLASS.cobaltLight,
    route: "/games-in-app",
  },
  {
    id: "external",
    label: "External Games",
    eyebrow: "Partners",
    detail: "Install, play, earn back",
    icon: "rocket-launch-outline",
    color: "#F6D98A",
    route: "/games-external",
  },
  {
    id: "surveys",
    label: "Surveys & Offers",
    eyebrow: "Tasks",
    detail: "Quick credits outside games",
    icon: "clipboard-check-outline",
    color: "#CDEFD8",
    route: "/offerwall",
  },
];

// ----------------------------------------------------------------------
// Hub-specific catalogs
//
// The /games hub now shows three EarningModeSection blocks with richer
// per-card data than the simple `GAME_ACTIVITIES` rows the detail pages
// use. Kept separate so the detail-page contract stays untouched.

export interface HubInAppGame {
  id: string;
  title: string;
  genre: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  cardColor: string;
  earnRate: string;
  badge?: "Hot" | "Live" | "New";
}

export interface HubPartnerGame {
  id: string;
  title: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  iconBgColor: string;
  milestone: string;
  payout: string;
  difficulty: "Easy" | "Medium" | "Hard";
}

export interface HubOffer {
  id: string;
  title: string;
  category: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  iconBgColor: string;
  timeEstimate: string;
  payout: string;
  availability: "New" | "Limited" | "Expiring" | "Hot";
}

export const HUB_INAPP_GAMES: HubInAppGame[] = [
  {
    id: "blackjack",
    title: "Blackjack",
    genre: "Cards",
    icon: "cards-playing-outline",
    cardColor: "#BAE6FD",
    earnRate: "8 CR/min",
    badge: "Hot",
  },
  {
    id: "block-blast",
    title: "Block Blast",
    genre: "Puzzle",
    icon: "view-grid-plus-outline",
    cardColor: "#00E5FF",
    earnRate: "12 CR/min",
    badge: "Live",
  },
  {
    id: "bricks-vs-balls",
    title: "Bricks vs Balls",
    genre: "Arcade",
    icon: "target",
    cardColor: "#FF4D8D",
    earnRate: "10 CR/min",
    badge: "New",
  },
  {
    id: "color-stack",
    title: "Color Stack",
    genre: "Level",
    icon: "layers-triple-outline",
    cardColor: "#8BFF5A",
    earnRate: "9 CR/min",
    badge: "Hot",
  },
];

export const HUB_PARTNER_GAMES: HubPartnerGame[] = [
  {
    id: "kingdom-build",
    title: "Kingdom Build",
    icon: "castle",
    iconBgColor: "#F6D98A",
    milestone: "Reach Level 30",
    payout: "$12.00",
    difficulty: "Medium",
  },
  {
    id: "galaxy-miner",
    title: "Galaxy Miner",
    icon: "pickaxe",
    iconBgColor: "#BAE6FD",
    milestone: "Mine 50 asteroids",
    payout: "$8.50",
    difficulty: "Easy",
  },
  {
    id: "merge-tycoon",
    title: "Merge Tycoon",
    icon: "diamond-stone",
    iconBgColor: "#DED1FB",
    milestone: "Reach city level 20",
    payout: "$24.00",
    difficulty: "Hard",
  },
];

export const HUB_OFFERS: HubOffer[] = [
  {
    id: "brand-pulse",
    title: "Brand Pulse Survey",
    category: "Survey",
    icon: "clipboard-text-outline",
    iconBgColor: "#A9E5FF",
    timeEstimate: "~6 min",
    payout: "$2.20",
    availability: "Hot",
  },
  {
    id: "snack-opinion",
    title: "Snack Opinion",
    category: "Survey",
    icon: "food-apple-outline",
    iconBgColor: "#CDEFD8",
    timeEstimate: "~2 min",
    payout: "$0.70",
    availability: "New",
  },
  {
    id: "offer-streak",
    title: "Offer Streak Bonus",
    category: "Bundle",
    icon: "format-list-checks",
    iconBgColor: "#FFD7C2",
    timeEstimate: "~12 min",
    payout: "$5.00",
    availability: "Limited",
  },
];

export const GAME_ACTIVITIES: GameActivity[] = [
  {
    name: "Blackjack",
    tag: "Classic table",
    icon: "cards-playing-outline",
    tone: "oceanic",
    category: "in-app",
    players: "1.2k online",
    payout: "1.5x",
    hot: true,
  },
  {
    name: "Poker",
    tag: "Texas Hold'em",
    icon: "cards",
    tone: "dark",
    category: "in-app",
    players: "842 online",
    payout: "2.0x",
  },
  {
    name: "Roulette",
    tag: "European wheel",
    icon: "circle-slice-8",
    tone: "sunset",
    category: "in-app",
    players: "1.8k online",
    payout: "35x",
    hot: true,
  },
  {
    name: "Vault Reels",
    tag: "Slots",
    icon: "slot-machine-outline",
    tone: "oceanic",
    category: "in-app",
    players: "2.4k online",
    payout: "100x",
  },
  {
    name: "Galaxy Miner",
    tag: "Partner arcade",
    icon: "pickaxe",
    tone: "cobalt",
    category: "external",
    players: "New offer",
    payout: "+900 CR",
    hot: true,
  },
  {
    name: "Kingdom Build",
    tag: "Reach level 12",
    icon: "castle",
    tone: "sunset",
    category: "external",
    players: "3 day window",
    payout: "+1,800 CR",
  },
  {
    name: "Daily Match",
    tag: "Partner puzzle",
    icon: "cards-heart-outline",
    tone: "oceanic",
    category: "external",
    players: "Fast install",
    payout: "+650 CR",
  },
  {
    name: "Brand Pulse",
    tag: "6 minute survey",
    icon: "clipboard-text-outline",
    tone: "cobalt",
    category: "surveys",
    players: "High match",
    payout: "+220 CR",
    hot: true,
  },
  {
    name: "Snack Opinion",
    tag: "2 minute survey",
    icon: "comment-question-outline",
    tone: "sunset",
    category: "surveys",
    players: "Quick task",
    payout: "+70 CR",
  },
  {
    name: "Offer Streak",
    tag: "Complete 3 tasks",
    icon: "format-list-checks",
    tone: "dark",
    category: "surveys",
    players: "Bonus ladder",
    payout: "+500 CR",
  },
];
