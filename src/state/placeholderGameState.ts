import seedrandom from "seedrandom";
import type { DifficultyScore, Level, RuntimeState } from "../types/game";

const PLACEHOLDER_SCORE: DifficultyScore = {
  T: 7,
  G: 3,
  X: 9,
  GX: 3,
  F: 2,
  I: 2,
  WF: 3,
  WI: 3,
  maxOutDegree: 2,
  maxInDegree: 1,
  graphDepth: 2,
};

export function seedPlaceholderLevel(seed: string): Level {
  const rng = seedrandom(seed);
  const q = 8;
  const n = 4;
  const initialOffsets = Array.from({ length: n }, () => 1 + Math.floor(rng() * (q - 1)));

  return {
    id: `placeholder-${seed}`,
    imageId: "placeholder-landscape",
    seed,
    difficultyName: "beginner",
    n,
    q,
    ringRadii: [0, 0.28, 0.52, 0.75, 1],
    matrix: [
      [1, 0, 0, 0],
      [1, 1, 0, 0],
      [0, -1, 1, 0],
      [0, 0, 1, 1],
    ],
    inverseMatrix: [
      [1, 0, 0, 0],
      [-1, 1, 0, 0],
      [-1, 1, 1, 0],
      [1, -1, -1, 1],
    ],
    initialOffsets,
    solution: initialOffsets.map((offset) => (q - offset) % q),
    difficulty: PLACEHOLDER_SCORE,
    showReferenceThumbnail: true,
    showCouplingHints: true,
  };
}

export function createPlaceholderRuntimeState(level: Level, now = Date.now()): RuntimeState {
  return {
    currentOffsets: [...level.initialOffsets],
    accumulatedMoves: Array(level.n).fill(0),
    moveHistory: [],
    totalTickMoves: 0,
    selectedRing: 1,
    previewTicks: 0,
    isSolved: false,
    startedAt: now,
    solvedAt: null,
  };
}
