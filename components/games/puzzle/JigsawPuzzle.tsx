import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Image,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, {
  ClipPath,
  Defs,
  Image as SvgImage,
  Path,
  Rect,
} from "react-native-svg";

import { GT } from "../../../constants/gameTemplates";
import { V2 } from "../../../constants/glassPalette";
import { typography } from "../../../constants/typography";
import {
  createGameRoute,
  type GameModeOption,
  type GameplayScreenProps,
} from "../createGameRoute";

type EdgeValue = -1 | 0 | 1;
type JigsawModeId = "classic" | "challenge" | "expert";

type PieceEdges = {
  top: EdgeValue;
  right: EdgeValue;
  bottom: EdgeValue;
  left: EdgeValue;
};

type PieceDefinition = {
  id: string;
  index: number;
  row: number;
  col: number;
  path: string;
  viewBox: string;
  edges: PieceEdges;
  targetX: number;
  targetY: number;
};

type PieceState = PieceDefinition & {
  x: number;
  y: number;
  placed: boolean;
  z: number;
};

type LevelSpec = {
  rows: number;
  cols: number;
  label: string;
};

type BoardGeometry = {
  cell: number;
  tab: number;
  boardW: number;
  boardH: number;
  pieceW: number;
  pieceH: number;
  stageW: number;
  stageH: number;
  boardX: number;
  boardY: number;
  trayY: number;
};

const MODE_OPTIONS: ReadonlyArray<GameModeOption<JigsawModeId>> = [
  {
    id: "classic",
    label: "Classic",
    description: "Start easy; the board grows every 10 levels. Continue as long as you like.",
  },
  {
    id: "challenge",
    label: "Challenge",
    description: "Start at level 11 on a 3×3 board; difficulty still steps up every 10 levels.",
  },
  {
    id: "expert",
    label: "Expert",
    description: "Start at level 21 with a larger grid; same 10-level difficulty jumps.",
  },
];

const MODE_START_LEVEL: Record<JigsawModeId, number> = {
  classic: 1,
  challenge: 11,
  expert: 21,
};

/** One spec per 10 levels; index = floor((level - 1) / 10), capped at last entry. */
const LEVEL_SPECS: LevelSpec[] = [
  { rows: 2, cols: 3, label: "6 pieces" },
  { rows: 3, cols: 3, label: "9 pieces" },
  { rows: 3, cols: 4, label: "12 pieces" },
  { rows: 4, cols: 4, label: "16 pieces" },
  { rows: 4, cols: 5, label: "20 pieces" },
  { rows: 5, cols: 5, label: "25 pieces" },
  { rows: 5, cols: 6, label: "30 pieces" },
  { rows: 6, cols: 6, label: "36 pieces" },
  { rows: 6, cols: 7, label: "42 pieces" },
  { rows: 7, cols: 7, label: "49 pieces" },
];

const IMAGE_POOL = [
  {
    id: "coast",
    title: "Coastline",
    uri: "https://picsum.photos/seed/vault-jigsaw-coast/900/900",
  },
  {
    id: "garden",
    title: "Garden",
    uri: "https://picsum.photos/seed/vault-jigsaw-garden/900/900",
  },
  {
    id: "summit",
    title: "Summit",
    uri: "https://picsum.photos/seed/vault-jigsaw-summit/900/900",
  },
  {
    id: "market",
    title: "Market",
    uri: "https://picsum.photos/seed/vault-jigsaw-market/900/900",
  },
  {
    id: "harbor",
    title: "Harbor",
    uri: "https://picsum.photos/seed/vault-jigsaw-harbor/900/900",
  },
] as const;

function JigsawGameplay({
  title,
  modeId,
  modeLabel,
  accent,
  accentSoft,
  accentInk,
  onQuit,
  onFinish,
}: GameplayScreenProps<JigsawModeId>) {
  const { width, height } = useWindowDimensions();
  const initialLevel = MODE_START_LEVEL[modeId];
  const [level, setLevel] = useState(initialLevel);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [imageIndex, setImageIndex] = useState(() => initialLevel % IMAGE_POOL.length);
  const [pieces, setPieces] = useState<PieceState[]>([]);
  const [paused, setPaused] = useState(false);
  const [levelSolved, setLevelSolved] = useState(false);
  const zRef = useRef(20);
  const piecesRef = useRef<PieceState[]>([]);

  const spec = getLevelSpec(level);
  const image = IMAGE_POOL[imageIndex % IMAGE_POOL.length];
  const geometry = useMemo(
    () => getBoardGeometry(width, height, spec.rows, spec.cols),
    [height, spec.cols, spec.rows, width],
  );
  const seed = level * 97 + imageIndex * 31 + modeId.length * 13;

  const definitions = useMemo(
    () => makePieceDefinitions(spec.rows, spec.cols, geometry, seed),
    [geometry, seed, spec.cols, spec.rows],
  );

  useEffect(() => {
    setLevel(MODE_START_LEVEL[modeId]);
    setScore(0);
    setMoves(0);
    setLevelSolved(false);
    setImageIndex(MODE_START_LEVEL[modeId] % IMAGE_POOL.length);
  }, [modeId]);

  useEffect(() => {
    const nextPieces = makeInitialPieces(definitions, geometry, seed);
    setPieces(nextPieces);
    piecesRef.current = nextPieces;
    setMoves(0);
    setLevelSolved(false);
    zRef.current = 20 + nextPieces.length;
  }, [definitions, geometry, seed]);

  useEffect(() => {
    piecesRef.current = pieces;
  }, [pieces]);

  const placedCount = pieces.filter((piece) => piece.placed).length;
  const totalPieces = spec.rows * spec.cols;
  const progressLabel = `${placedCount}/${totalPieces}`;

  const movePiece = useCallback((id: string, x: number, y: number) => {
    setPieces((current) =>
      current.map((piece) => (piece.id === id ? { ...piece, x, y } : piece)),
    );
  }, []);

  const raisePiece = useCallback((id: string) => {
    zRef.current += 1;
    setPieces((current) =>
      current.map((piece) => (piece.id === id ? { ...piece, z: zRef.current } : piece)),
    );
  }, []);

  const dropPiece = useCallback(
    (id: string, finalX?: number, finalY?: number) => {
      const current = piecesRef.current;
      const found = current.find((piece) => piece.id === id);
      const active =
        found && finalX !== undefined && finalY !== undefined
          ? { ...found, x: finalX, y: finalY }
          : found;
      if (!active || active.placed) return;

      setMoves((value) => value + 1);
      const distance = Math.hypot(active.x - active.targetX, active.y - active.targetY);
      const snapDistance = Math.max(18, geometry.cell * 0.28);
      const shouldSnap = distance <= snapDistance;

      if (!shouldSnap) {
        if (finalX !== undefined && finalY !== undefined) {
          movePiece(id, finalX, finalY);
        }
        return;
      }

      const next = current.map((piece) =>
        piece.id === id
          ? {
              ...piece,
              x: piece.targetX,
              y: piece.targetY,
              placed: true,
              z: 4,
            }
          : piece,
      );
      piecesRef.current = next;
      setPieces(next);
      setScore((value) => value + 35 + level * 2 + totalPieces);

      if (next.every((piece) => piece.placed)) {
        setLevelSolved(true);
        setScore((value) => value + totalPieces * 25 + Math.max(0, 80 - moves * 2));
      }
    },
    [geometry.cell, level, movePiece, moves, totalPieces],
  );

  const restartLevel = useCallback(() => {
    const nextPieces = makeInitialPieces(definitions, geometry, seed + moves + 1);
    piecesRef.current = nextPieces;
    setPieces(nextPieces);
    setMoves(0);
    setLevelSolved(false);
  }, [definitions, geometry, moves, seed]);

  const nextImage = useCallback(() => {
    setImageIndex((value) => (value + 1) % IMAGE_POOL.length);
  }, []);

  const continueToNextLevel = useCallback(() => {
    setLevel((value) => value + 1);
    setImageIndex((value) => (value + 1) % IMAGE_POOL.length);
  }, []);

  const claimAndExit = useCallback(() => {
    onFinish(score);
  }, [onFinish, score]);

  const nextSpec = useMemo(() => getLevelSpec(level + 1), [level]);
  const boardGrowsNext = useMemo(() => {
    const cur = getLevelSpec(level);
    return cur.rows !== nextSpec.rows || cur.cols !== nextSpec.cols;
  }, [level, nextSpec.cols, nextSpec.rows]);

  return (
    <View style={[styles.root, { backgroundColor: accentSoft }]}>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Exit game"
            hitSlop={8}
            onPress={onQuit}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          >
            <Ionicons name="chevron-back" size={22} color={V2.ink} />
          </Pressable>

          <View style={styles.titleBlock}>
            <Text numberOfLines={1} adjustsFontSizeToFit style={styles.gameTitle}>
              {title}
            </Text>
            <Text numberOfLines={1} style={styles.gameSubtitle}>
              {modeLabel} · Level {level}
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Pause game"
            hitSlop={8}
            onPress={() => setPaused(true)}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          >
            <Ionicons name="pause" size={20} color={V2.ink} />
          </Pressable>
        </View>

        <View style={styles.hudRow}>
          <HudPill label="Score" value={String(score)} />
          <HudPill label="Pieces" value={progressLabel} />
          <HudPill label="Moves" value={String(moves)} />
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaLeft}>
            <MaterialCommunityIcons name="image-filter-hdr" size={16} color={accent} />
            <Text numberOfLines={1} style={styles.metaText}>
              {image.title} · {spec.label}
            </Text>
          </View>
          <View style={[styles.difficultyPill, { backgroundColor: accent }]}>
            <Text style={styles.difficultyText}>Tier {Math.floor((level - 1) / 10) + 1}</Text>
          </View>
        </View>

        <View style={[styles.stage, { width: geometry.stageW, height: geometry.stageH }]}>
          <View
            style={[
              styles.board,
              {
                width: geometry.boardW,
                height: geometry.boardH,
                left: geometry.boardX,
                top: geometry.boardY,
              },
            ]}
          >
            <Image source={{ uri: image.uri }} style={styles.boardImage} resizeMode="cover" />
            <View style={styles.boardWash} />
            <Svg
              pointerEvents="none"
              width={geometry.boardW + geometry.tab * 2}
              height={geometry.boardH + geometry.tab * 2}
              viewBox={`${-geometry.tab} ${-geometry.tab} ${
                geometry.boardW + geometry.tab * 2
              } ${geometry.boardH + geometry.tab * 2}`}
              style={[
                styles.slotSvg,
                {
                  left: -geometry.tab,
                  top: -geometry.tab,
                },
              ]}
            >
              {definitions.map((piece) => (
                <Path
                  key={piece.id}
                  d={piece.path}
                  fill="rgba(255,255,255,0.08)"
                  stroke="rgba(255,255,255,0.72)"
                  strokeWidth={1.4}
                  strokeDasharray="4 5"
                />
              ))}
            </Svg>
          </View>

          <View
            pointerEvents="none"
            style={[
              styles.trayHint,
              {
                top: geometry.trayY - 4,
                width: geometry.stageW,
              },
            ]}
          >
            <Text style={styles.trayHintText}>Drag pieces into the picture</Text>
          </View>

          {pieces.map((piece) => (
            <PuzzlePiece
              key={piece.id}
              piece={piece}
              geometry={geometry}
              imageUri={image.uri}
              accent={accent}
              onMove={movePiece}
              onRaise={raisePiece}
              onDrop={dropPiece}
            />
          ))}
        </View>

        {levelSolved ? (
          <View style={styles.levelCompleteCallout}>
            <View style={[styles.levelCompleteIcon, { backgroundColor: `${accent}22` }]}>
              <Ionicons name="checkmark-circle" size={22} color={accent} />
            </View>
            <View style={styles.levelCompleteCopy}>
              <Text style={styles.levelCompleteTitle}>Level {level} complete</Text>
              <Text style={styles.levelCompleteSub} numberOfLines={2}>
                {totalPieces} pieces · Score {score}
                {boardGrowsNext ? ` · Next: level ${level + 1} (${nextSpec.label}, larger board)` : ` · Next: level ${level + 1} (${nextSpec.label})`}
              </Text>
            </View>
          </View>
        ) : null}

        <View style={styles.controlDock}>
          {levelSolved ? (
            <>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Go to level ${level + 1}`}
                onPress={continueToNextLevel}
                style={({ pressed }) => [
                  styles.dockPrimaryButton,
                  { backgroundColor: accent, borderColor: "rgba(0,0,0,0.12)" },
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="play-forward" size={16} color="#FFFFFF" />
                <Text style={styles.dockPrimaryText}>Next level</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Claim score and exit"
                onPress={claimAndExit}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  styles.dockButtonGrow,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="ribbon-outline" size={16} color={accentInk} />
                <Text style={[styles.secondaryText, { color: accentInk }]}>Claim & exit</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Restart puzzle"
                onPress={restartLevel}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  styles.dockButtonGrow,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="refresh" size={16} color={accentInk} />
                <Text style={[styles.secondaryText, { color: accentInk }]}>Restart</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Use another image"
                onPress={nextImage}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  styles.dockButtonGrow,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="images-outline" size={16} color={accentInk} />
                <Text style={[styles.secondaryText, { color: accentInk }]}>Image</Text>
              </Pressable>
            </>
          )}
        </View>
      </SafeAreaView>

      <PauseModal
        visible={paused}
        onResume={() => setPaused(false)}
        onRestart={() => {
          setPaused(false);
          restartLevel();
        }}
        onClaimExit={claimAndExit}
        onQuit={onQuit}
      />
    </View>
  );
}

function PuzzlePiece({
  piece,
  geometry,
  imageUri,
  accent,
  onMove,
  onRaise,
  onDrop,
}: {
  piece: PieceState;
  geometry: BoardGeometry;
  imageUri: string;
  accent: string;
  onMove: (id: string, x: number, y: number) => void;
  onRaise: (id: string) => void;
  onDrop: (id: string, finalX?: number, finalY?: number) => void;
}) {
  const pieceRef = useRef(piece);
  const startRef = useRef({ x: piece.x, y: piece.y });

  useEffect(() => {
    pieceRef.current = piece;
  }, [piece]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !pieceRef.current.placed,
        onMoveShouldSetPanResponder: (_, gesture) =>
          !pieceRef.current.placed && Math.abs(gesture.dx) + Math.abs(gesture.dy) > 3,
        onPanResponderGrant: () => {
          const current = pieceRef.current;
          startRef.current = { x: current.x, y: current.y };
          onRaise(current.id);
        },
        onPanResponderMove: (_, gesture) => {
          const current = pieceRef.current;
          onMove(
            current.id,
            startRef.current.x + gesture.dx,
            startRef.current.y + gesture.dy,
          );
        },
        onPanResponderRelease: (_, gesture) => {
          const current = pieceRef.current;
          const finalX = startRef.current.x + gesture.dx;
          const finalY = startRef.current.y + gesture.dy;
          onMove(current.id, finalX, finalY);
          onDrop(current.id, finalX, finalY);
        },
        onPanResponderTerminate: (_, gesture) => {
          const current = pieceRef.current;
          const finalX = startRef.current.x + gesture.dx;
          const finalY = startRef.current.y + gesture.dy;
          onMove(current.id, finalX, finalY);
          onDrop(current.id, finalX, finalY);
        },
      }),
    [onDrop, onMove, onRaise],
  );

  return (
    <View
      {...panResponder.panHandlers}
      style={[
        styles.piece,
        piece.placed && styles.piecePlaced,
        {
          left: piece.x,
          top: piece.y,
          width: geometry.pieceW,
          height: geometry.pieceH,
          zIndex: piece.z,
        },
      ]}
    >
      <Svg width={geometry.pieceW} height={geometry.pieceH} viewBox={piece.viewBox}>
        <Defs>
          <ClipPath id={`clip-${piece.id}`}>
            <Path d={piece.path} />
          </ClipPath>
        </Defs>
        <Rect
          x={piece.col * geometry.cell - geometry.tab}
          y={piece.row * geometry.cell - geometry.tab}
          width={geometry.pieceW}
          height={geometry.pieceH}
          fill="rgba(255,255,255,0.78)"
          clipPath={`url(#clip-${piece.id})`}
        />
        <SvgImage
          href={{ uri: imageUri }}
          x={0}
          y={0}
          width={geometry.boardW}
          height={geometry.boardH}
          preserveAspectRatio="xMidYMid slice"
          clipPath={`url(#clip-${piece.id})`}
        />
        <Path
          d={piece.path}
          fill="transparent"
          stroke={piece.placed ? "rgba(255,255,255,0.48)" : accent}
          strokeWidth={piece.placed ? 1 : 1.6}
        />
      </Svg>
    </View>
  );
}

function HudPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.hudPill}>
      <Text style={styles.hudLabel}>{label}</Text>
      <Text numberOfLines={1} adjustsFontSizeToFit style={styles.hudValue}>
        {value}
      </Text>
    </View>
  );
}

function PauseModal({
  visible,
  onResume,
  onRestart,
  onClaimExit,
  onQuit,
}: {
  visible: boolean;
  onResume: () => void;
  onRestart: () => void;
  onClaimExit: () => void;
  onQuit: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onResume}>
      <View style={styles.modalScrim}>
        <View style={styles.modalCard}>
          <Text style={styles.modalEyebrow}>Paused</Text>
          <Text style={styles.modalTitle}>Jigsaw is waiting</Text>
          <Pressable
            accessibilityRole="button"
            onPress={onResume}
            style={({ pressed }) => [styles.modalPrimary, pressed && styles.pressed]}
          >
            <Text style={styles.modalPrimaryText}>Resume</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={onRestart}
            style={({ pressed }) => [styles.modalSecondary, pressed && styles.pressed]}
          >
            <Text style={styles.modalSecondaryText}>Restart level</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={onClaimExit}
            style={({ pressed }) => [styles.modalSecondary, pressed && styles.pressed]}
          >
            <Text style={styles.modalSecondaryText}>Claim score & exit</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={onQuit}
            style={({ pressed }) => [styles.modalExit, pressed && styles.pressed]}
          >
            <Text style={styles.modalExitText}>Exit without claiming</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function getLevelSpec(level: number): LevelSpec {
  const index = Math.min(LEVEL_SPECS.length - 1, Math.floor((level - 1) / 10));
  return LEVEL_SPECS[index];
}

function getBoardGeometry(
  width: number,
  height: number,
  rows: number,
  cols: number,
): BoardGeometry {
  const availableW = Math.min(width - 24, 430);
  const availableBoardH = Math.min(360, height * (height < 740 ? 0.34 : 0.4));
  const cell = Math.max(46, Math.floor(Math.min(availableW / cols, availableBoardH / rows)));
  const tab = Math.max(8, Math.round(cell * 0.18));
  const boardW = cell * cols;
  const boardH = cell * rows;
  const pieceW = cell + tab * 2;
  const pieceH = cell + tab * 2;
  const stageW = Math.min(width - 16, Math.max(boardW + tab * 2, 330));
  const boardX = Math.round((stageW - boardW) / 2);
  const boardY = tab + 8;
  const trayY = boardY + boardH + tab + 26;
  const trayH = height < 740 ? 136 : 166;
  const stageH = trayY + trayH;

  return {
    cell,
    tab,
    boardW,
    boardH,
    pieceW,
    pieceH,
    stageW,
    stageH,
    boardX,
    boardY,
    trayY,
  };
}

function makePieceDefinitions(
  rows: number,
  cols: number,
  geometry: BoardGeometry,
  seed: number,
): PieceDefinition[] {
  const grid: PieceDefinition[][] = [];
  const pieces: PieceDefinition[] = [];

  for (let row = 0; row < rows; row += 1) {
    const rowPieces: PieceDefinition[] = [];
    for (let col = 0; col < cols; col += 1) {
      const top: EdgeValue =
        row === 0 ? 0 : ((-grid[row - 1][col].edges.bottom) as EdgeValue);
      const left: EdgeValue =
        col === 0 ? 0 : ((-rowPieces[col - 1].edges.right) as EdgeValue);
      const right: EdgeValue = col === cols - 1 ? 0 : seededSign(seed, row, col, 1);
      const bottom: EdgeValue = row === rows - 1 ? 0 : seededSign(seed, row, col, 2);
      const x = col * geometry.cell;
      const y = row * geometry.cell;
      const path = makePiecePath(x, y, geometry.cell, geometry.tab, {
        top,
        right,
        bottom,
        left,
      });
      const piece: PieceDefinition = {
        id: `${row}-${col}`,
        index: row * cols + col,
        row,
        col,
        path,
        viewBox: `${x - geometry.tab} ${y - geometry.tab} ${geometry.pieceW} ${
          geometry.pieceH
        }`,
        edges: { top, right, bottom, left },
        targetX: geometry.boardX + x - geometry.tab,
        targetY: geometry.boardY + y - geometry.tab,
      };
      rowPieces.push(piece);
      pieces.push(piece);
    }
    grid.push(rowPieces);
  }

  return pieces;
}

function makeInitialPieces(
  definitions: PieceDefinition[],
  geometry: BoardGeometry,
  seed: number,
): PieceState[] {
  return [...definitions]
    .sort((a, b) => pseudoRandom(seed, a.index) - pseudoRandom(seed, b.index))
    .map((piece, trayIndex) => {
      const xNoise = pseudoRandom(seed + 17, piece.index);
      const yNoise = pseudoRandom(seed + 31, piece.index);
      const x =
        geometry.tab +
        xNoise * Math.max(1, geometry.stageW - geometry.pieceW - geometry.tab * 2);
      const rowOffset = (trayIndex % 3) * (geometry.cell * 0.18);
      const y =
        geometry.trayY +
        yNoise * Math.max(1, geometry.stageH - geometry.trayY - geometry.pieceH) +
        rowOffset;

      return {
        ...piece,
        x: clamp(x, 0, geometry.stageW - geometry.pieceW),
        y: clamp(y, geometry.trayY - geometry.tab, geometry.stageH - geometry.pieceH),
        placed: false,
        z: trayIndex + 10,
      };
    });
}

function seededSign(seed: number, row: number, col: number, salt: number): EdgeValue {
  return ((seed + row * 41 + col * 29 + salt * 17) % 2 === 0 ? 1 : -1) as EdgeValue;
}

function makePiecePath(
  x: number,
  y: number,
  size: number,
  tab: number,
  edges: PieceEdges,
): string {
  const right = x + size;
  const bottom = y + size;
  return [
    `M ${fmt(x)} ${fmt(y)}`,
    horizontalEdge(x, y, right, edges.top, -1, size, tab),
    verticalEdge(right, y, bottom, edges.right, 1, size, tab),
    horizontalEdge(right, bottom, x, edges.bottom, 1, size, tab),
    verticalEdge(x, bottom, y, edges.left, -1, size, tab),
    "Z",
  ].join(" ");
}

function horizontalEdge(
  x1: number,
  y: number,
  x2: number,
  edge: EdgeValue,
  outward: 1 | -1,
  size: number,
  tab: number,
): string {
  if (edge === 0) return `L ${fmt(x2)} ${fmt(y)}`;
  const dir = x2 > x1 ? 1 : -1;
  const offset = edge * outward * tab;
  const a = x1 + dir * size * 0.28;
  const b = x1 + dir * size * 0.38;
  const mid = x1 + dir * size * 0.5;
  const c = x1 + dir * size * 0.62;
  const d = x1 + dir * size * 0.72;

  return [
    `L ${fmt(a)} ${fmt(y)}`,
    `C ${fmt(b)} ${fmt(y)} ${fmt(b)} ${fmt(y + offset)} ${fmt(mid)} ${fmt(
      y + offset,
    )}`,
    `C ${fmt(c)} ${fmt(y + offset)} ${fmt(c)} ${fmt(y)} ${fmt(d)} ${fmt(y)}`,
    `L ${fmt(x2)} ${fmt(y)}`,
  ].join(" ");
}

function verticalEdge(
  x: number,
  y1: number,
  y2: number,
  edge: EdgeValue,
  outward: 1 | -1,
  size: number,
  tab: number,
): string {
  if (edge === 0) return `L ${fmt(x)} ${fmt(y2)}`;
  const dir = y2 > y1 ? 1 : -1;
  const offset = edge * outward * tab;
  const a = y1 + dir * size * 0.28;
  const b = y1 + dir * size * 0.38;
  const mid = y1 + dir * size * 0.5;
  const c = y1 + dir * size * 0.62;
  const d = y1 + dir * size * 0.72;

  return [
    `L ${fmt(x)} ${fmt(a)}`,
    `C ${fmt(x)} ${fmt(b)} ${fmt(x + offset)} ${fmt(b)} ${fmt(x + offset)} ${fmt(
      mid,
    )}`,
    `C ${fmt(x + offset)} ${fmt(c)} ${fmt(x)} ${fmt(c)} ${fmt(x)} ${fmt(d)}`,
    `L ${fmt(x)} ${fmt(y2)}`,
  ].join(" ");
}

function pseudoRandom(seed: number, index: number): number {
  const value = Math.sin(seed * 12.9898 + index * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function fmt(value: number): string {
  return Number(value.toFixed(2)).toString();
}

const JigsawPuzzleGame = createGameRoute<JigsawModeId>({
  gameId: "jigsaw-puzzle",
  modeOptions: MODE_OPTIONS,
  GameplayScreen: JigsawGameplay,
});

export default JigsawPuzzleGame;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 16,
  },
  topBar: {
    width: "100%",
    maxWidth: 430,
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.74)",
    borderWidth: 1,
    borderColor: V2.hairlineStrong,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  gameTitle: {
    ...typography.bold,
    fontSize: 20,
    color: V2.ink,
  },
  gameSubtitle: {
    ...typography.medium,
    marginTop: 2,
    fontSize: 12,
    color: V2.muted,
  },
  hudRow: {
    width: "100%",
    maxWidth: 430,
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  hudPill: {
    flex: 1,
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.82)",
    borderWidth: 1,
    borderColor: V2.hairline,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  hudLabel: {
    ...typography.medium,
    fontSize: 10,
    color: V2.muted,
    textTransform: "uppercase",
  },
  hudValue: {
    ...typography.bold,
    marginTop: 3,
    fontSize: 18,
    color: V2.ink,
    fontVariant: ["tabular-nums"],
  },
  metaRow: {
    width: "100%",
    maxWidth: 430,
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 8,
  },
  metaLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    ...typography.semibold,
    flex: 1,
    fontSize: 12,
    color: V2.ink2,
  },
  difficultyPill: {
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  difficultyText: {
    ...typography.bold,
    fontSize: 11,
    color: "#FFFFFF",
  },
  stage: {
    marginTop: 4,
    position: "relative",
    overflow: "visible",
  },
  board: {
    position: "absolute",
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: GT.card,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.88)",
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  boardImage: {
    width: "100%",
    height: "100%",
  },
  boardWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.28)",
  },
  slotSvg: {
    position: "absolute",
  },
  trayHint: {
    position: "absolute",
    alignItems: "center",
  },
  trayHintText: {
    ...typography.semibold,
    fontSize: 11,
    color: V2.muted,
    textTransform: "uppercase",
  },
  piece: {
    position: "absolute",
    shadowColor: "#000000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  piecePlaced: {
    shadowOpacity: 0,
    elevation: 0,
  },
  controlDock: {
    width: "100%",
    maxWidth: 430,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    paddingBottom: 8,
  },
  levelCompleteCallout: {
    width: "100%",
    maxWidth: 430,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: V2.hairline,
    backgroundColor: "rgba(255,255,255,0.78)",
  },
  levelCompleteIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  levelCompleteCopy: {
    flex: 1,
    minWidth: 0,
  },
  levelCompleteTitle: {
    ...typography.bold,
    fontSize: 16,
    color: V2.ink,
    letterSpacing: -0.2,
  },
  levelCompleteSub: {
    ...typography.semibold,
    marginTop: 2,
    fontSize: 12,
    lineHeight: 16,
    color: V2.muted,
  },
  dockPrimaryButton: {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  dockPrimaryText: {
    ...typography.bold,
    fontSize: 13,
    color: "#FFFFFF",
  },
  secondaryButton: {
    minHeight: 48,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 14,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderWidth: 1,
    borderColor: V2.hairline,
  },
  dockButtonGrow: {
    flex: 1,
  },
  secondaryText: {
    ...typography.bold,
    fontSize: 13,
  },
  pressed: {
    opacity: 0.78,
  },
  modalScrim: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(0,0,0,0.34)",
  },
  modalCard: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: V2.hairline,
    padding: 22,
    alignItems: "center",
  },
  modalEyebrow: {
    ...typography.bold,
    fontSize: 12,
    color: V2.muted,
    textTransform: "uppercase",
  },
  modalTitle: {
    ...typography.bold,
    marginTop: 8,
    fontSize: 24,
    color: V2.ink,
    textAlign: "center",
  },
  modalPrimary: {
    width: "100%",
    minHeight: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: V2.cyan,
  },
  modalPrimaryText: {
    ...typography.bold,
    fontSize: 15,
    color: "#FFFFFF",
  },
  modalSecondary: {
    width: "100%",
    minHeight: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    backgroundColor: V2.cyanSoft,
  },
  modalSecondaryText: {
    ...typography.bold,
    fontSize: 14,
    color: V2.cyanInk,
  },
  modalExit: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    paddingHorizontal: 16,
  },
  modalExitText: {
    ...typography.bold,
    fontSize: 14,
    color: V2.muted,
  },
});
