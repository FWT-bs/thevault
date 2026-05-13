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
  "word-ladder": {
    id: "word-ladder",
    name: "Word Ladder",
    tagline: "Snap clues onto the right rungs",
    accent: "#7C5CFF",
    accentSoft: "#EDE7FF",
    accentInk: "#33208A",
    art: "puzzle",
    modes: [
      { id: "classic", label: "Classic", sub: "4 rungs · gentle climb" },
      { id: "challenge", label: "Challenge", sub: "6 rungs · faster", tag: "NEW" },
      { id: "expert", label: "Expert", sub: "8 rungs · all the way", tag: "FAST" },
    ],
    stats: [
      { label: "Best level", value: "0" },
      { label: "Ladders solved", value: "0" },
      { label: "Today", value: "+0" },
    ],
    tasks: [
      { l: "Solve a full ladder", p: 0, t: 1, reward: "+25 CR" },
      { l: "Finish without mistakes", p: 0, t: 1, reward: "+30 CR" },
      { l: "Reach level 5", p: 0, t: 1, reward: "+45 CR" },
    ],
    tips: [
      "Each rung answer changes one letter from the rung above.",
      "Use the clue plus the locked first rung to seed your start.",
      "Wrong-place rungs glow amber — tap to pick the word back up.",
      "Drag a word onto a rung or tap-to-select for two-step placement.",
    ],
    launch: {
      heroTitle: "Word",
      heroAccentTitle: "Ladder",
      heroDescription: "Match clues to four-letter rungs.\nClimb level by level.",
      balanceLabel: "$4.82",
      levelLabel: "Gold",
      shareLabel: "45%",
      primaryLabel: "Play Now",
      secondaryLabel: "Practice Ladder",
      rows: [
        {
          icon: "target",
          title: "Level Ladder",
          body: "Rungs grow from 4 to 8 as you advance.",
          accentText: "Steady ramp.",
          badge: "SCALING",
        },
        {
          icon: "rewards",
          title: "Daily Ladder",
          body: "Solve today's chain:",
          accentText: "+25 CR",
          timer: "Resets daily",
        },
      ],
      footer: [
        { icon: "rules", label: "Rules" },
        { icon: "practice", label: "Practice" },
        { icon: "rewards", label: "Rewards" },
      ],
    },
  },
  "block-blast": {
    id: "block-blast",
    name: "Block Blast",
    tagline: "Pop connected blocks to clear the target",
    accent: "#F59E0B",
    accentSoft: "#FFF3D6",
    accentInk: "#7A3F00",
    art: "puzzle",
    modes: [
      { id: "classic", label: "Classic", sub: "6×6 · gentle ramp" },
      { id: "challenge", label: "Challenge", sub: "7×7 · denser boards", tag: "NEW" },
      { id: "expert", label: "Expert", sub: "8×8 · everything counts", tag: "FAST" },
    ],
    stats: [
      { label: "Best level", value: "0" },
      { label: "Blocks popped", value: "0" },
      { label: "Today", value: "+0" },
    ],
    tasks: [
      { l: "Clear a level", p: 0, t: 1, reward: "+15 CR" },
      { l: "Pop a group of 5+", p: 0, t: 1, reward: "+20 CR" },
      { l: "Reach level 4", p: 0, t: 1, reward: "+35 CR" },
    ],
    tips: [
      "Tap any colored block to clear it and its same-color neighbours.",
      "Bigger groups score exponentially more points.",
      "Each level raises the target needed to advance.",
      "Plan ahead — once you start a chain, isolated blocks stay behind.",
    ],
    launch: {
      heroTitle: "Block",
      heroAccentTitle: "Blast",
      heroDescription: "Match colors. Chain combos.\nBlast through every level target.",
      balanceLabel: "$4.82",
      levelLabel: "Gold",
      shareLabel: "45%",
      primaryLabel: "Play Now",
      secondaryLabel: "Practice Board",
      rows: [
        {
          icon: "target",
          title: "Target Pops",
          body: "Each level raises the pop target by 4.",
          accentText: "Combo to climb.",
          badge: "SCALING",
        },
        {
          icon: "rewards",
          title: "Daily Blast",
          body: "Clear three levels today:",
          accentText: "+30 CR",
          timer: "Resets daily",
        },
      ],
      footer: [
        { icon: "rules", label: "Rules" },
        { icon: "practice", label: "Practice" },
        { icon: "rewards", label: "Rewards" },
      ],
    },
  },
  "bricks-vs-balls": {
    id: "bricks-vs-balls",
    name: "Bricks vs Balls",
    tagline: "Aim, launch, level up",
    accent: "#F4A4A4",
    accentSoft: "#FFE6E6",
    accentInk: "#7A1E2C",
    art: "generic",
    modes: [
      { id: "classic", label: "Classic", sub: "5 lanes · steady balls" },
      { id: "challenge", label: "Challenge", sub: "6 lanes · taller wall", tag: "NEW" },
      { id: "expert", label: "Expert", sub: "Dense wall · few balls", tag: "FAST" },
    ],
    stats: [
      { label: "Best level", value: "0" },
      { label: "Bricks busted", value: "0" },
      { label: "Today", value: "+0" },
    ],
    tasks: [
      { l: "Clear a wall", p: 0, t: 1, reward: "+20 CR" },
      { l: "Hit a brick with last ball", p: 0, t: 1, reward: "+25 CR" },
      { l: "Reach level 4", p: 0, t: 1, reward: "+40 CR" },
    ],
    tips: [
      "Each lane launches every remaining ball at the bottom-most brick.",
      "Bricks have hit points — chain lanes to chip away.",
      "You earn extra balls every level you clear.",
      "Save your balls for full bricks rather than splash damage.",
    ],
    launch: {
      heroTitle: "Bricks",
      heroAccentTitle: "vs Balls",
      heroDescription: "Aim the volley. Drop the wall.\nLevel up between launches.",
      balanceLabel: "$4.82",
      levelLabel: "Gold",
      shareLabel: "45%",
      primaryLabel: "Play Now",
      secondaryLabel: "Practice Wall",
      rows: [
        {
          icon: "target",
          title: "Climbing Walls",
          body: "Brick values grow with each level.",
          accentText: "Aim smart.",
          badge: "SCALING",
        },
        {
          icon: "rewards",
          title: "Daily Wall",
          body: "Clear two walls in a row:",
          accentText: "+25 CR",
          timer: "Resets daily",
        },
      ],
      footer: [
        { icon: "rules", label: "Rules" },
        { icon: "practice", label: "Practice" },
        { icon: "rewards", label: "Rewards" },
      ],
    },
  },
  "color-stack": {
    id: "color-stack",
    name: "Color Stack",
    tagline: "Build the tower by level",
    accent: "#3CB371",
    accentSoft: "#DCF5E6",
    accentInk: "#0E5132",
    art: "generic",
    modes: [
      { id: "classic", label: "Classic", sub: "Stack 6 to start" },
      { id: "challenge", label: "Challenge", sub: "Start at level 5", tag: "NEW" },
      { id: "expert", label: "Expert", sub: "Pattern sequence", tag: "FAST" },
    ],
    stats: [
      { label: "Best tower", value: "0" },
      { label: "Stacks built", value: "0" },
      { label: "Today", value: "+0" },
    ],
    tasks: [
      { l: "Finish a tower", p: 0, t: 1, reward: "+15 CR" },
      { l: "Stack without restart", p: 0, t: 1, reward: "+25 CR" },
      { l: "Reach level 4", p: 0, t: 1, reward: "+40 CR" },
    ],
    tips: [
      "Each level adds 2 to the target tower height.",
      "Use color buttons to add blocks in any order.",
      "Tap restart to clear the current stack and try again.",
      "The pattern hint refreshes each level — match it for bonus.",
    ],
    launch: {
      heroTitle: "Color",
      heroAccentTitle: "Stack",
      heroDescription: "Build the tower color by color.\nMatch the pattern. Climb every level.",
      balanceLabel: "$4.82",
      levelLabel: "Gold",
      shareLabel: "45%",
      primaryLabel: "Play Now",
      secondaryLabel: "Practice Tower",
      rows: [
        {
          icon: "target",
          title: "Tower Ladder",
          body: "Target height grows every level.",
          accentText: "+2 per level.",
          badge: "SCALING",
        },
        {
          icon: "rewards",
          title: "Daily Tower",
          body: "Solve today's pattern:",
          accentText: "+25 CR",
          timer: "Resets daily",
        },
      ],
      footer: [
        { icon: "rules", label: "Rules" },
        { icon: "practice", label: "Practice" },
        { icon: "rewards", label: "Rewards" },
      ],
    },
  },
  "jigsaw-puzzle": {
    id: "jigsaw-puzzle",
    name: "Jigsaw Puzzle",
    tagline: "Snap images back together",
    accent: GT.cyan,
    accentSoft: GT.cyanSoft,
    accentInk: GT.cyanInk,
    art: "puzzle",
    modes: [
      { id: "classic", label: "Classic", sub: "Level 1 · 6 pieces" },
      { id: "challenge", label: "Challenge", sub: "Level 11 · 9 pieces", tag: "NEW" },
      { id: "expert", label: "Expert", sub: "Level 21 · 12 pieces", tag: "FAST" },
    ],
    stats: [
      { label: "Best level", value: "24" },
      { label: "Images solved", value: "18" },
      { label: "Today", value: "+120" },
    ],
    tasks: [
      { l: "Solve 3 jigsaws", p: 1, t: 3, reward: "+30 CR" },
      { l: "Reach level 11", p: 0, t: 1, reward: "+45 CR" },
      { l: "Finish under 20 moves", p: 0, t: 1, reward: "+20 CR" },
    ],
    tips: [
      "Corner pieces stay flat on two sides.",
      "Every 10 levels adds a larger puzzle grid.",
      "Tabs and holes are generated fresh for each board.",
      "Use the image button when you want a new picture.",
    ],
    launch: {
      heroTitle: "Jigsaw",
      heroAccentTitle: "Puzzle",
      heroDescription: "Drag pieces. Match tabs.\nClimb tougher image boards.",
      balanceLabel: "$4.82",
      levelLabel: "Gold",
      shareLabel: "45%",
      primaryLabel: "Play Now",
      secondaryLabel: "Practice Puzzle",
      rows: [
        {
          icon: "target",
          title: "Level Ladder",
          body: "Piece count increases every 10 levels.",
          accentText: "6 to 20 pieces.",
          badge: "SCALING",
        },
        {
          icon: "rewards",
          title: "Image Mix",
          body: "Online images rotate each level:",
          accentText: "+30 CR task",
          timer: "Fresh boards",
        },
      ],
      footer: [
        { icon: "rules", label: "Rules" },
        { icon: "practice", label: "Practice" },
        { icon: "rewards", label: "Rewards" },
      ],
    },
  },
  "fruit-merge": {
    id: "fruit-merge",
    name: "Fruit Merge",
    tagline: "Merge into bigger fruit, don't overflow",
    accent: "#F472B6",
    accentSoft: "#FCE7F3",
    accentInk: "#831843",
    art: "generic",
    modes: [
      { id: "easy", label: "Easy", sub: "Wide jar · gentle physics" },
      { id: "normal", label: "Normal", sub: "Standard jar", tag: "NEW" },
      { id: "hard", label: "Hard", sub: "Narrow, bouncy jar", tag: "FAST" },
    ],
    stats: [
      { label: "Best score", value: "0" },
      { label: "Top fruit", value: "Seed" },
      { label: "Today", value: "+0" },
    ],
    tasks: [
      { l: "Merge to Citrus tier", p: 0, t: 1, reward: "+15 CR" },
      { l: "Reach a 200+ score", p: 0, t: 1, reward: "+25 CR" },
      { l: "Spawn the Vault fruit", p: 0, t: 1, reward: "+60 CR" },
    ],
    tips: [
      "Same-tier fruits that touch merge into the next tier.",
      "Don't let any fruit sit above the danger line for more than a moment.",
      "Use Left / Right to nudge the drop column — or tap the jar to set it.",
      "Big fruits don't bounce — plan their landing spot carefully.",
    ],
    launch: {
      heroTitle: "Fruit",
      heroAccentTitle: "Merge",
      heroDescription: "Drop, merge, repeat.\nKeep the jar from overflowing.",
      balanceLabel: "$4.82",
      levelLabel: "Gold",
      shareLabel: "45%",
      primaryLabel: "Play Now",
      secondaryLabel: "Practice Jar",
      rows: [
        {
          icon: "target",
          title: "Tier Climb",
          body: "Six fruit tiers from Seed to Vault — bigger merges score more.",
          accentText: "+60 for Vault.",
          badge: "SCALING",
        },
        {
          icon: "rewards",
          title: "Daily Jar",
          body: "Bank a 200+ score:",
          accentText: "+25 CR",
          timer: "Resets daily",
        },
      ],
      footer: [
        { icon: "rules", label: "Rules" },
        { icon: "practice", label: "Practice" },
        { icon: "rewards", label: "Rewards" },
      ],
    },
  },
  coloring: {
    id: "coloring",
    name: "Coloring",
    tagline: "Paint by region, by number",
    accent: "#EC4899",
    accentSoft: "#FCE7F3",
    accentInk: "#831843",
    art: "generic",
    modes: [
      { id: "free", label: "Free", sub: "Any color, any region" },
      { id: "number", label: "By Number", sub: "Match the number", tag: "NEW" },
      { id: "timed", label: "Timed", sub: "90 seconds", tag: "FAST" },
    ],
    stats: [
      { label: "Pages finished", value: "0" },
      { label: "Cleanest run", value: "0" },
      { label: "Today", value: "+0" },
    ],
    tasks: [
      { l: "Finish any picture", p: 0, t: 1, reward: "+15 CR" },
      { l: "Finish with 0 mistakes", p: 0, t: 1, reward: "+25 CR" },
      { l: "Beat a timed page", p: 0, t: 1, reward: "+35 CR" },
    ],
    tips: [
      "Pick a paint swatch first, then tap the cells with that number.",
      "Wrong colors in By Number mode add to the mistake count.",
      "Each finished picture awards an accuracy bonus.",
      "Timed mode pays out leftover seconds — finish quick for max score.",
    ],
    launch: {
      heroTitle: "Coloring",
      heroAccentTitle: "Pages",
      heroDescription: "Pick a swatch.\nFill the page in.",
      balanceLabel: "$4.82",
      levelLabel: "Gold",
      shareLabel: "45%",
      primaryLabel: "Play Now",
      secondaryLabel: "Practice Page",
      rows: [
        {
          icon: "target",
          title: "Page Pack",
          body: "Rotating set of pixel scenes per session.",
          accentText: "More on the way.",
          badge: "FRESH",
        },
        {
          icon: "rewards",
          title: "Clean Page",
          body: "Finish a By Number page with 0 mistakes:",
          accentText: "+25 CR",
          timer: "Resets daily",
        },
      ],
      footer: [
        { icon: "rules", label: "Rules" },
        { icon: "practice", label: "Practice" },
        { icon: "rewards", label: "Rewards" },
      ],
    },
  },
  plinko: {
    id: "plinko",
    name: "Plinko",
    tagline: "Drop the puck, chase the slots",
    accent: "#F97316",
    accentSoft: "#FFEDD5",
    accentInk: "#7C2D12",
    art: "generic",
    modes: [
      { id: "casual", label: "Casual", sub: "6 balls · gentle pegs" },
      { id: "ranked", label: "Ranked", sub: "5 balls · climbing targets", tag: "NEW" },
      { id: "expert", label: "Expert", sub: "3 balls · dense pegs", tag: "FAST" },
    ],
    stats: [
      { label: "Best level", value: "0" },
      { label: "Balls dropped", value: "0" },
      { label: "Today", value: "+0" },
    ],
    tasks: [
      { l: "Hit the center slot", p: 0, t: 1, reward: "+15 CR" },
      { l: "Clear a level with balls left", p: 0, t: 1, reward: "+25 CR" },
      { l: "Reach ranked level 4", p: 0, t: 1, reward: "+35 CR" },
    ],
    tips: [
      "Center bucket pays 100, edges only pay 10. Aim for the middle row.",
      "Use Left / Right to slide the drop selector before tapping DROP.",
      "Every spare ball after clearing the target adds a 25-point bonus.",
      "Pucks bounce randomly — sometimes a side-drop is the safer play.",
    ],
    launch: {
      heroTitle: "Plinko",
      heroAccentTitle: "Drop",
      heroDescription: "Read the pegs.\nHit your target bucket.",
      balanceLabel: "$4.82",
      levelLabel: "Gold",
      shareLabel: "45%",
      primaryLabel: "Play Now",
      secondaryLabel: "Practice Drop",
      rows: [
        {
          icon: "target",
          title: "Level Target",
          body: "Each level demands a higher cumulative score.",
          accentText: "Banks all spare balls.",
          badge: "SCALING",
        },
        {
          icon: "rewards",
          title: "Daily Drop",
          body: "Clear a level with 2+ balls spare:",
          accentText: "+25 CR",
          timer: "Resets daily",
        },
      ],
      footer: [
        { icon: "rules", label: "Rules" },
        { icon: "practice", label: "Practice" },
        { icon: "rewards", label: "Rewards" },
      ],
    },
  },
  "water-sorter": {
    id: "water-sorter",
    name: "Water Sorter",
    tagline: "Pour the tubes back into order",
    accent: "#14B8A6",
    accentSoft: "#CCFBF1",
    accentInk: "#134E4A",
    art: "puzzle",
    modes: [
      { id: "easy", label: "Easy", sub: "3 colors · 2 spares" },
      { id: "medium", label: "Medium", sub: "5 colors · 2 spares", tag: "NEW" },
      { id: "hard", label: "Hard", sub: "7 colors · 1 spare", tag: "FAST" },
    ],
    stats: [
      { label: "Best level", value: "0" },
      { label: "Tubes sorted", value: "0" },
      { label: "Today", value: "+0" },
    ],
    tasks: [
      { l: "Sort any level", p: 0, t: 1, reward: "+15 CR" },
      { l: "Sort in under 25 moves", p: 0, t: 1, reward: "+25 CR" },
      { l: "Reach medium level 5", p: 0, t: 1, reward: "+40 CR" },
    ],
    tips: [
      "Tap a tube to lift the top color, then tap another tube to pour.",
      "You can only pour onto an empty tube or a tube with the same top color.",
      "Pours move the whole top run of matching color — plan space first.",
      "Spare empty tubes are your scratchpad. Use them sparingly.",
    ],
    launch: {
      heroTitle: "Water",
      heroAccentTitle: "Sorter",
      heroDescription: "Pour, plan, repeat.\nSort every tube clean.",
      balanceLabel: "$4.82",
      levelLabel: "Gold",
      shareLabel: "45%",
      primaryLabel: "Play Now",
      secondaryLabel: "Practice Pour",
      rows: [
        {
          icon: "target",
          title: "Color Ladder",
          body: "Each level adds tougher mixes and fewer spares.",
          accentText: "Up to 7 colors.",
          badge: "SCALING",
        },
        {
          icon: "rewards",
          title: "Move Bonus",
          body: "Finish fast — fewer moves means more points.",
          accentText: "+25 CR",
          timer: "Resets daily",
        },
      ],
      footer: [
        { icon: "rules", label: "Rules" },
        { icon: "practice", label: "Practice" },
        { icon: "rewards", label: "Rewards" },
      ],
    },
  },
  "single-line": {
    id: "single-line",
    name: "Single Line",
    tagline: "Trace every edge with one line",
    accent: "#8B5CF6",
    accentSoft: "#EDE9FE",
    accentInk: "#3B1675",
    art: "puzzle",
    modes: [
      { id: "easy", label: "Easy", sub: "4–6 nodes" },
      { id: "medium", label: "Medium", sub: "7–10 nodes", tag: "NEW" },
      { id: "hard", label: "Hard", sub: "Required starts", tag: "FAST" },
    ],
    stats: [
      { label: "Best level", value: "0" },
      { label: "Graphs solved", value: "0" },
      { label: "Today", value: "+0" },
    ],
    tasks: [
      { l: "Solve any level", p: 0, t: 1, reward: "+15 CR" },
      { l: "Solve without undo", p: 0, t: 1, reward: "+25 CR" },
      { l: "Clear medium mode", p: 0, t: 1, reward: "+40 CR" },
    ],
    tips: [
      "Some levels force a starting dot — look for the highlighted node.",
      "Walking into a dead end is fine — undo and try a different branch.",
      "Use every line exactly once, no skipping.",
      "Longer graphs reward more points when claimed.",
    ],
    launch: {
      heroTitle: "Single",
      heroAccentTitle: "Line",
      heroDescription: "Connect every dot.\nDo it in one stroke.",
      balanceLabel: "$4.82",
      levelLabel: "Gold",
      shareLabel: "45%",
      primaryLabel: "Play Now",
      secondaryLabel: "Practice Graph",
      rows: [
        {
          icon: "target",
          title: "Edge Ladder",
          body: "Graphs get bigger and twistier each level.",
          accentText: "Up to 14 edges.",
          badge: "SCALING",
        },
        {
          icon: "rewards",
          title: "Clean Solve",
          body: "Solve a graph without undo:",
          accentText: "+25 CR",
          timer: "Resets daily",
        },
      ],
      footer: [
        { icon: "rules", label: "Rules" },
        { icon: "practice", label: "Practice" },
        { icon: "rewards", label: "Rewards" },
      ],
    },
  },
  "high-low": {
    id: "high-low",
    name: "High Low",
    tagline: "Predict the next vault card",
    accent: "#0EA5E9",
    accentSoft: "#E0F2FE",
    accentInk: "#0C4A6E",
    art: "generic",
    modes: [
      { id: "steady", label: "Steady", sub: "3 lives · ties safe" },
      { id: "streak", label: "Streak", sub: "1 life · no timer", tag: "NEW" },
      { id: "sprint", label: "Sprint", sub: "6s per guess", tag: "FAST" },
    ],
    stats: [
      { label: "Best streak", value: "0" },
      { label: "Runs played", value: "0" },
      { label: "Today", value: "+0" },
    ],
    tasks: [
      { l: "Hit a streak of 5", p: 0, t: 1, reward: "+15 CR" },
      { l: "Bank a 200+ score", p: 0, t: 1, reward: "+25 CR" },
      { l: "Clear a sprint run", p: 0, t: 1, reward: "+35 CR" },
    ],
    tips: [
      "Higher / Lower compare ranks: 2 is lowest, Ace is highest.",
      "Ties count as safe in Steady — but cost a life on Streak and Sprint.",
      "Points scale with your streak — every correct pick is worth more than the last.",
      "Cash out any time to bank your score before the deck turns on you.",
    ],
    launch: {
      heroTitle: "High",
      heroAccentTitle: "Low",
      heroDescription: "Flip the vault deck.\nBank the streak.",
      balanceLabel: "$4.82",
      levelLabel: "Gold",
      shareLabel: "45%",
      primaryLabel: "Play Now",
      secondaryLabel: "Practice Run",
      rows: [
        {
          icon: "target",
          title: "Streak Multiplier",
          body: "Every correct pick adds 10 × current streak to your score.",
          accentText: "Push it.",
          badge: "SCALING",
        },
        {
          icon: "rewards",
          title: "Daily Run",
          body: "Bank a 200+ score today:",
          accentText: "+25 CR",
          timer: "Resets daily",
        },
      ],
      footer: [
        { icon: "rules", label: "Rules" },
        { icon: "practice", label: "Practice" },
        { icon: "rewards", label: "Rewards" },
      ],
    },
  },
};
