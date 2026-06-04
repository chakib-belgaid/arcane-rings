import { cyclicDistance, matVecMod, modNorm } from "../math/mod";
import type { GameAction, Level, RuntimeState } from "./types";

export function createRuntimeState(level: Level, now = Date.now()): RuntimeState {
  return {
    accumulatedMoves: Array.from({ length: level.n }, () => 0),
    moveHistory: [],
    totalTickMoves: 0,
    selectedRing: null,
    previewTicks: 0,
    isSolved: false,
    startedAt: now,
    solvedAt: null,
    hintCount: 0,
    highlightedRing: null
  };
}

export function getCurrentOffsets(level: Level, state: RuntimeState): number[] {
  const moveOffsets = matVecMod(level.matrix, state.accumulatedMoves, level.q);
  return level.initialOffsets.map((offset, index) => modNorm(offset + moveOffsets[index], level.q));
}

export function getPreviewOffsets(level: Level, state: RuntimeState): number[] {
  if (state.selectedRing === null || state.previewTicks === 0) {
    return getCurrentOffsets(level, state);
  }

  const previewMoves = [...state.accumulatedMoves];
  previewMoves[state.selectedRing] = modNorm(previewMoves[state.selectedRing] + state.previewTicks, level.q);
  const moveOffsets = matVecMod(level.matrix, previewMoves, level.q);
  return level.initialOffsets.map((offset, index) => modNorm(offset + moveOffsets[index], level.q));
}

export function getAffectedRings(level: Level, controlRing: number | null): number[] {
  if (controlRing === null) {
    return [];
  }

  return level.matrix
    .map((row, index) => ({ index, factor: row[controlRing] ?? 0 }))
    .filter(({ factor }) => modNorm(factor, level.q) !== 0)
    .map(({ index }) => index);
}

export function isSolved(level: Level, state: RuntimeState): boolean {
  return getCurrentOffsets(level, state).every((offset) => modNorm(offset, level.q) === 0);
}

export function getStars(level: Level, state: RuntimeState): 0 | 1 | 2 | 3 {
  if (!state.isSolved) {
    return 0;
  }

  if (state.totalTickMoves <= Math.ceil(level.optimalTickCost * 1.35)) {
    return 3;
  }

  if (state.totalTickMoves <= level.moveBudget) {
    return 2;
  }

  return 1;
}

export function reducer(state: RuntimeState, level: Level, action: GameAction): RuntimeState {
  switch (action.type) {
    case "selectRing":
      return { ...state, selectedRing: action.ring, previewTicks: 0 };

    case "previewRotation":
      return {
        ...state,
        selectedRing: action.controlRing,
        previewTicks: modNorm(action.deltaTicks, level.q)
      };

    case "commitRotation": {
      const normalizedDelta = modNorm(action.deltaTicks, level.q);
      if (normalizedDelta === 0) {
        return { ...state, selectedRing: action.controlRing, previewTicks: 0 };
      }

      const accumulatedMoves = [...state.accumulatedMoves];
      accumulatedMoves[action.controlRing] = modNorm(
        accumulatedMoves[action.controlRing] + normalizedDelta,
        level.q
      );

      const affectedDelta = level.matrix.map((row) => modNorm((row[action.controlRing] ?? 0) * normalizedDelta, level.q));
      const move = {
        controlRing: action.controlRing,
        deltaTicks: normalizedDelta,
        affectedDelta,
        createdAt: action.now ?? Date.now()
      };
      const next = {
        ...state,
        accumulatedMoves,
        moveHistory: [...state.moveHistory, move],
        totalTickMoves: state.totalTickMoves + cyclicDistance(normalizedDelta, level.q),
        selectedRing: null,
        previewTicks: 0
      };

      return { ...next, isSolved: isSolved(level, next) };
    }

    case "undo": {
      const lastMove = state.moveHistory.at(-1);
      if (!lastMove) {
        return state;
      }

      const accumulatedMoves = [...state.accumulatedMoves];
      accumulatedMoves[lastMove.controlRing] = modNorm(
        accumulatedMoves[lastMove.controlRing] - lastMove.deltaTicks,
        level.q
      );

      return {
        ...state,
        accumulatedMoves,
        moveHistory: state.moveHistory.slice(0, -1),
        totalTickMoves: Math.max(0, state.totalTickMoves - cyclicDistance(lastMove.deltaTicks, level.q)),
        selectedRing: null,
        previewTicks: 0,
        isSolved: false,
        solvedAt: null,
        highlightedRing: lastMove.controlRing
      };
    }

    case "requestHint": {
      const targetRing = level.solution.findIndex((solutionTicks, index) => {
        const current = state.accumulatedMoves[index] ?? 0;
        return modNorm(solutionTicks - current, level.q) !== 0;
      });

      return {
        ...state,
        hintCount: state.hintCount + 1,
        highlightedRing: targetRing === -1 ? null : targetRing
      };
    }

    case "restart":
      return createRuntimeState(level, action.now);

    case "completeIfSolved":
      if (!isSolved(level, state)) {
        return state;
      }

      return {
        ...state,
        isSolved: true,
        solvedAt: state.solvedAt ?? action.now
      };

    default:
      return state;
  }
}
