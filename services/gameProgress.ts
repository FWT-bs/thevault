import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_PREFIX = "@thevault/game-progress/";

export type GameProgress = {
  bestScore: number;
  lastLevel: number;
  tutorialSeen: boolean;
};

const DEFAULT_PROGRESS: GameProgress = {
  bestScore: 0,
  lastLevel: 1,
  tutorialSeen: false,
};

function keyFor(gameId: string) {
  return `${STORAGE_PREFIX}${gameId}`;
}

async function readProgress(gameId: string): Promise<GameProgress> {
  try {
    const raw = await AsyncStorage.getItem(keyFor(gameId));
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw) as Partial<GameProgress>;
    return {
      bestScore: typeof parsed.bestScore === "number" ? parsed.bestScore : 0,
      lastLevel: typeof parsed.lastLevel === "number" ? parsed.lastLevel : 1,
      tutorialSeen: parsed.tutorialSeen === true,
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

async function writeProgress(gameId: string, value: GameProgress) {
  try {
    await AsyncStorage.setItem(keyFor(gameId), JSON.stringify(value));
  } catch {
    // Best-effort; failure shouldn't break gameplay.
  }
}

/**
 * Hook that hydrates a game's saved progress (best score, last level,
 * tutorial-seen flag) and exposes `merge` to update it. Persists writes
 * asynchronously; UI never blocks on storage.
 */
export function useGameProgress(gameId: string) {
  const [progress, setProgress] = useState<GameProgress | null>(null);
  const latest = useRef<GameProgress>(DEFAULT_PROGRESS);

  useEffect(() => {
    let cancelled = false;
    readProgress(gameId).then((value) => {
      if (cancelled) return;
      latest.current = value;
      setProgress(value);
    });
    return () => {
      cancelled = true;
    };
  }, [gameId]);

  const merge = useCallback(
    (patch: Partial<GameProgress>) => {
      const merged = { ...latest.current, ...patch };
      // Best score is monotone — never decrease.
      if (typeof patch.bestScore === "number") {
        merged.bestScore = Math.max(latest.current.bestScore, patch.bestScore);
      }
      latest.current = merged;
      setProgress(merged);
      void writeProgress(gameId, merged);
    },
    [gameId],
  );

  const markTutorialSeen = useCallback(() => merge({ tutorialSeen: true }), [merge]);

  return { progress, merge, markTutorialSeen };
}
