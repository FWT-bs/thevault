// Vault — Generic in-app game template config
// Ported from design/project/components/game-templates.jsx (gameConfig schema).
// Drives <GameLoader/> and <GameLanding/>.

export type GameMode = {
  id: string;
  label: string;
  sub: string;
  tag?: "HOT" | "LIVE" | "NEW" | "FAST";
};

export type GameStat = {
  label: string;
  value: string;
};

export type GameTask = {
  l: string;
  p: number;
  t: number;
  reward: string;
  done?: boolean;
};

export type GameArtKind = "blackjack" | "slots" | "puzzle" | "generic";

export type GameLaunchIcon =
  | "rocket"
  | "target"
  | "calendar"
  | "rules"
  | "fairPlay"
  | "rewards"
  | "practice"
  | "cards"
  | "shield";

export type GameLaunchRow = {
  icon: GameLaunchIcon;
  title: string;
  body: string;
  accentText?: string;
  badge?: string;
  timer?: string;
};

export type GameLaunchFooterItem = {
  icon: GameLaunchIcon;
  label: string;
};

export type GameLaunchConfig = {
  heroTitle: string;
  heroAccentTitle?: string;
  heroDescription: string;
  balanceLabel: string;
  levelLabel: string;
  shareLabel: string;
  primaryLabel: string;
  secondaryLabel?: string;
  rows: GameLaunchRow[];
  footer: GameLaunchFooterItem[];
};

export type GameConfig = {
  id: string;
  name: string;
  tagline: string;
  accent: string;
  accentSoft: string;
  accentInk: string;
  art: GameArtKind;
  modes: GameMode[];
  stats: GameStat[];
  tasks: GameTask[];
  tips: string[];
  launch: GameLaunchConfig;
};

export const GT = {
  bg: "#FAFAF7",
  card: "#FFFFFF",
  ink: "#0A0A0A",
  muted: "#6B6B70",
  faint: "#A1A1A6",
  hairline: "rgba(0,0,0,0.06)",
  hairlineStrong: "rgba(0,0,0,0.10)",
  cyan: "#0A84FF",
  cyanSoft: "#E6F3FF",
  cyanInk: "#003A7A",
  amber: "#FF9F0A",
  amberSoft: "#FFF1DC",
  amberInk: "#7A3F00",
  green: "#30D158",
} as const;

export const GAME_CONFIGS: Record<string, GameConfig> = {
  blackjack: {
    id: "blackjack",
    name: "Blackjack",
    tagline: "Classic 21",
    accent: GT.cyan,
    accentSoft: GT.cyanSoft,
    accentInk: GT.cyanInk,
    art: "blackjack",
    modes: [
      { id: "classic", label: "Classic", sub: "Single deck" },
    ],
    stats: [
      { label: "Best streak", value: "12" },
      { label: "Hands won", value: "74" },
      { label: "Win rate", value: "58%" },
    ],
    tasks: [
      { l: "Win 3 hands in a row", p: 2, t: 3, reward: "+50 CR" },
      { l: "Hit a natural 21", p: 0, t: 1, reward: "+25 CR" },
      { l: "Play 10 hands today", p: 6, t: 10, reward: "+10 CR" },
    ],
    tips: [
      "Always split aces and eights.",
      "Stand on hard 17 or higher.",
      "Doubling down doubles risk and reward.",
      "Dealer must hit until 17.",
      "Insurance is rarely a good bet.",
    ],
    launch: {
      heroTitle: "Blackjack",
      heroAccentTitle: "Royale",
      heroDescription: "Win rounds. Unlock ads.\nEarn verified rewards.",
      balanceLabel: "$4.82",
      levelLabel: "Gold",
      shareLabel: "45%",
      primaryLabel: "Play Now",
      secondaryLabel: "Practice Mode",
      rows: [
        {
          icon: "rocket",
          title: "Today's Boost",
          body: "Watch 1 ad after 3 rounds to claim",
          accentText: "+45% share reward.",
          badge: "+45% SHARE",
        },
        {
          icon: "target",
          title: "Daily Challenge",
          body: "Win 2 rounds:",
          accentText: "+$0.03 cap",
          timer: "12:18:45",
        },
      ],
      footer: [
        { icon: "rules", label: "Rules" },
        { icon: "fairPlay", label: "Fair Play" },
        { icon: "rewards", label: "Rewards" },
      ],
    },
  },
  slots: {
    id: "slots",
    name: "Vault Slots",
    tagline: "Spin, match, win",
    accent: GT.amber,
    accentSoft: GT.amberSoft,
    accentInk: GT.amberInk,
    art: "slots",
    modes: [
      { id: "classic", label: "Classic", sub: "3 reels · 1× payout" },
      { id: "mega", label: "Mega Spin", sub: "5 reels · jackpots", tag: "NEW" },
      { id: "jackpot", label: "Jackpot Hour", sub: "Live · 14m left", tag: "LIVE" },
    ],
    stats: [
      { label: "Spins", value: "248" },
      { label: "Best win", value: "1,200" },
      { label: "Jackpots", value: "2" },
    ],
    tasks: [
      { l: "Spin 20 times today", p: 12, t: 20, reward: "+15 CR" },
      { l: "Land 3 matching reels", p: 1, t: 3, reward: "+30 CR" },
      { l: "Hit a jackpot", p: 0, t: 1, reward: "+200 CR" },
    ],
    tips: [
      "Each spin is independent.",
      "Bigger bets unlock larger jackpots.",
      "Jackpot Hour doubles all wins.",
      "Match three Vault icons to trigger bonus.",
    ],
    launch: {
      heroTitle: "Vault",
      heroAccentTitle: "Slots",
      heroDescription: "Spin quick reels. Unlock boosts.\nStack verified rewards.",
      balanceLabel: "$4.82",
      levelLabel: "Gold",
      shareLabel: "45%",
      primaryLabel: "Play Now",
      secondaryLabel: "Practice Spin",
      rows: [
        {
          icon: "rocket",
          title: "Spin Boost",
          body: "Play 15 spins to unlock",
          accentText: "+20% share reward.",
          badge: "+20% SHARE",
        },
        {
          icon: "target",
          title: "Daily Jackpot",
          body: "Land 3 Vault icons:",
          accentText: "+75 CR",
          timer: "09:42:18",
        },
      ],
      footer: [
        { icon: "rules", label: "Rules" },
        { icon: "fairPlay", label: "Fair Play" },
        { icon: "rewards", label: "Rewards" },
      ],
    },
  },
  puzzle: {
    id: "puzzle",
    name: "Block Puzzle",
    tagline: "Clear lines, climb the board",
    accent: GT.cyan,
    accentSoft: GT.cyanSoft,
    accentInk: GT.cyanInk,
    art: "puzzle",
    modes: [
      { id: "classic", label: "Classic", sub: "Endless · no timer" },
      { id: "sprint", label: "Sprint", sub: "90 seconds · 2×", tag: "FAST" },
      { id: "puzzle", label: "Daily Puzzle", sub: "Today’s board", tag: "NEW" },
    ],
    stats: [
      { label: "Best score", value: "24,680" },
      { label: "Lines cleared", value: "1,420" },
      { label: "Today", value: "+340" },
    ],
    tasks: [
      { l: "Clear 50 lines", p: 32, t: 50, reward: "+20 CR" },
      { l: "Score 5,000 in Sprint", p: 1, t: 1, reward: "+40 CR", done: true },
      { l: "Solve daily puzzle", p: 0, t: 1, reward: "+25 CR" },
    ],
    tips: [
      "Plan ahead — pieces queue for 3 turns.",
      "Clearing 4 lines triggers a chain bonus.",
      "Daily puzzles never run out of moves.",
      "Holding L-shapes is usually a trap.",
    ],
    launch: {
      heroTitle: "Block",
      heroAccentTitle: "Puzzle",
      heroDescription: "Clear lines. Build streaks.\nEarn reward progress.",
      balanceLabel: "$4.82",
      levelLabel: "Gold",
      shareLabel: "45%",
      primaryLabel: "Play Now",
      secondaryLabel: "Practice Board",
      rows: [
        {
          icon: "rocket",
          title: "Line Boost",
          body: "Clear 50 lines today to claim",
          accentText: "+20 CR.",
          badge: "+20 CR",
        },
        {
          icon: "target",
          title: "Daily Puzzle",
          body: "Solve today's board:",
          accentText: "+25 CR",
          timer: "14:08:31",
        },
      ],
      footer: [
        { icon: "rules", label: "Rules" },
        { icon: "fairPlay", label: "Fair Play" },
        { icon: "rewards", label: "Rewards" },
      ],
    },
  },
};
