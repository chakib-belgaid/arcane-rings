import { describe, expect, test } from "bun:test";
import {
  applyPlayerMove,
  computePreviewOffsets,
  computeStars,
  createRuntimeState,
  selectHint,
  undoLastMove,
} from "../src/state/gameState";

const matrix = [
  [1, 0, 0],
  [2, 1, 0],
  [-1, 0, 1],
];

describe("runtime state", () => {
  test("applyPlayerMove updates affected rings and tracks committed tick cost", () => {
    const state = createRuntimeState([7, 6, 11], 1000);
    const next = applyPlayerMove(state, matrix, 0, 2, 12, 1100);

    expect(next.currentOffsets).toEqual([9, 10, 9]);
    expect(next.accumulatedMoves).toEqual([2, 0, 0]);
    expect(next.totalTickMoves).toBe(2);
    expect(next.moveHistory).toEqual([
      {
        controlRing: 0,
        deltaTicks: 2,
        affectedDelta: [2, 4, 10],
        createdAt: 1100,
      },
    ]);
    expect(state.currentOffsets).toEqual([7, 6, 11]);
  });

  test("applyPlayerMove supports negative delta ticks", () => {
    const state = createRuntimeState([1, 2, 3], 1000);
    const next = applyPlayerMove(state, matrix, 0, -1, 12, 1100);

    expect(next.currentOffsets).toEqual([0, 0, 4]);
    expect(next.accumulatedMoves).toEqual([11, 0, 0]);
    expect(next.totalTickMoves).toBe(1);
  });

  test("computePreviewOffsets does not mutate committed runtime state", () => {
    const state = createRuntimeState([7, 6, 11], 1000);
    const preview = computePreviewOffsets(state.currentOffsets, matrix, 0, 2, 12);

    expect(preview).toEqual([9, 10, 9]);
    expect(state.currentOffsets).toEqual([7, 6, 11]);
    expect(state.moveHistory).toEqual([]);
  });

  test("undoLastMove restores offsets and accumulated moves without adding tick cost", () => {
    const state = createRuntimeState([7, 6, 11], 1000);
    const moved = applyPlayerMove(state, matrix, 0, 2, 12, 1100);
    const undone = undoLastMove(moved, matrix, 12);

    expect(undone.currentOffsets).toEqual(state.currentOffsets);
    expect(undone.accumulatedMoves).toEqual(state.accumulatedMoves);
    expect(undone.moveHistory).toEqual([]);
    expect(undone.totalTickMoves).toBe(2);
  });

  test("solved detection fires after the final correction", () => {
    const state = createRuntimeState([10, 8, 2], 1000);
    const next = applyPlayerMove(state, matrix, 0, 2, 12, 1100);

    expect(next.currentOffsets).toEqual([0, 0, 0]);
    expect(next.isSolved).toBe(true);
    expect(next.solvedAt).toBe(1100);
  });

  test("selectHint chooses the largest remaining cyclic correction", () => {
    const state = createRuntimeState([0, 0, 0], 1000);
    const moved = applyPlayerMove(state, matrix, 1, 1, 12, 1100);
    const hint = selectHint([1, 4, 7], moved.accumulatedMoves, 12);

    expect(hint).toEqual({
      ring: 2,
      remainingTicks: 7,
      distance: 5,
      signedTicks: -5,
    });
  });

  test("computeStars compares player tick cost to optimal cost", () => {
    expect(computeStars(20, 22)).toBe(3);
    expect(computeStars(20, 28)).toBe(2);
    expect(computeStars(20, 29)).toBe(1);
  });
});
