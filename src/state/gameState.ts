import { cyclicDistance, modNorm, shortestSignedDelta } from "../math/mod";
import type { Hint, PlayerMove, RuntimeState, StarRating } from "./types";

export function createRuntimeState(initialOffsets: number[], startedAt: number): RuntimeState {
  const isSolved = initialOffsets.every((value) => value === 0);

  return {
    currentOffsets: [...initialOffsets],
    accumulatedMoves: Array(initialOffsets.length).fill(0) as number[],
    moveHistory: [],
    totalTickMoves: 0,
    selectedRing: null,
    previewTicks: 0,
    isSolved,
    startedAt,
    solvedAt: isSolved ? startedAt : null,
  };
}

export function computePreviewOffsets(
  currentOffsets: number[],
  matrix: number[][],
  controlRing: number,
  previewTicks: number,
  q: number
): number[] {
  return currentOffsets.map((offset, i) =>
    modNorm(offset + (matrix[i]?.[controlRing] ?? 0) * previewTicks, q)
  );
}

function withSolvedStatus(state: RuntimeState, q: number, now: number | null): RuntimeState {
  const isSolved = state.currentOffsets.every((value) => modNorm(value, q) === 0);
  return {
    ...state,
    isSolved,
    solvedAt: isSolved ? state.solvedAt ?? now : null,
  };
}

export function applyPlayerMove(
  state: RuntimeState,
  matrix: number[][],
  controlRing: number,
  deltaTicks: number,
  q: number,
  now: number
): RuntimeState {
  const affectedDelta = matrix.map((row) => modNorm((row[controlRing] ?? 0) * deltaTicks, q));
  const currentOffsets = computePreviewOffsets(
    state.currentOffsets,
    matrix,
    controlRing,
    deltaTicks,
    q
  );

  const accumulatedMoves = [...state.accumulatedMoves];
  accumulatedMoves[controlRing] = modNorm(
    (accumulatedMoves[controlRing] ?? 0) + deltaTicks,
    q
  );

  const move: PlayerMove = {
    controlRing,
    deltaTicks,
    affectedDelta,
    createdAt: now,
  };

  return withSolvedStatus(
    {
      ...state,
      currentOffsets,
      accumulatedMoves,
      moveHistory: [...state.moveHistory, move],
      totalTickMoves: state.totalTickMoves + Math.abs(deltaTicks),
      previewTicks: 0,
    },
    q,
    now
  );
}

export function undoLastMove(state: RuntimeState, matrix: number[][], q: number): RuntimeState {
  const lastMove = state.moveHistory.at(-1);
  if (!lastMove) return state;

  const currentOffsets = computePreviewOffsets(
    state.currentOffsets,
    matrix,
    lastMove.controlRing,
    -lastMove.deltaTicks,
    q
  );
  const accumulatedMoves = [...state.accumulatedMoves];
  accumulatedMoves[lastMove.controlRing] = modNorm(
    (accumulatedMoves[lastMove.controlRing] ?? 0) - lastMove.deltaTicks,
    q
  );

  return withSolvedStatus(
    {
      ...state,
      currentOffsets,
      accumulatedMoves,
      moveHistory: state.moveHistory.slice(0, -1),
      previewTicks: 0,
    },
    q,
    null
  );
}

export function selectHint(solution: number[], accumulatedMoves: number[], q: number): Hint {
  let best: Hint = null;

  for (let ring = 0; ring < solution.length; ring += 1) {
    const remainingTicks = modNorm((solution[ring] ?? 0) - (accumulatedMoves[ring] ?? 0), q);
    const distance = cyclicDistance(remainingTicks, q);
    if (distance === 0) continue;

    if (!best || distance > best.distance) {
      best = {
        ring,
        remainingTicks,
        distance,
        signedTicks: shortestSignedDelta(remainingTicks, q),
      };
    }
  }

  return best;
}

export function computeStars(optimalCost: number, playerCost: number): StarRating {
  if (optimalCost < 0 || playerCost < 0) {
    throw new RangeError("Costs must be non-negative");
  }
  if (playerCost <= Math.ceil(1.1 * optimalCost)) return 3;
  if (playerCost <= Math.ceil(1.4 * optimalCost)) return 2;
  return 1;
}
