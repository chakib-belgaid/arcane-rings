import { describe, expect, test } from "vitest";
import { demoLevel } from "../levels/demoLevel";
import { createRuntimeState, getCurrentOffsets, getFirstCouplingEdge, getStars, reducer } from "./gameState";

describe("game reducer", () => {
  test("keeps preview rotation transient until commit", () => {
    const state = createRuntimeState(demoLevel, 1_000);
    const preview = reducer(state, demoLevel, { type: "previewRotation", controlRing: 0, deltaTicks: 1 });

    expect(getCurrentOffsets(demoLevel, state)).toEqual(demoLevel.initialOffsets);
    expect(preview.previewTicks).toBe(1);
    expect(preview.selectedRing).toBe(0);
  });

  test("commits coupled ring rotation and supports undo", () => {
    const state = createRuntimeState(demoLevel, 1_000);
    const committed = reducer(state, demoLevel, { type: "commitRotation", controlRing: 0, deltaTicks: 1 });

    expect(committed.totalTickMoves).toBe(1);
    expect(committed.moveHistory).toHaveLength(1);
    expect(getCurrentOffsets(demoLevel, committed)).toEqual([0, 3, 4, 6, 0]);

    const undone = reducer(committed, demoLevel, { type: "undo" });
    expect(getCurrentOffsets(demoLevel, undone)).toEqual(demoLevel.initialOffsets);
    expect(undone.totalTickMoves).toBe(0);
  });

  test("zero tick commit selects a ring for keyboard rotation without adding a move", () => {
    const state = createRuntimeState(demoLevel, 1_000);
    const selected = reducer(state, demoLevel, { type: "commitRotation", controlRing: 2, deltaTicks: 0 });

    expect(selected.selectedRing).toBe(2);
    expect(selected.totalTickMoves).toBe(0);
    expect(selected.moveHistory).toHaveLength(0);
  });

  test("recognizes a solved level and scores stars from move budget", () => {
    let state = createRuntimeState(demoLevel, 1_000);
    demoLevel.solution.forEach((deltaTicks, controlRing) => {
      state = reducer(state, demoLevel, { type: "commitRotation", controlRing, deltaTicks });
    });
    state = reducer(state, demoLevel, { type: "completeIfSolved", now: 8_000 });

    expect(getCurrentOffsets(demoLevel, state)).toEqual([0, 0, 0, 0, 0]);
    expect(state.isSolved).toBe(true);
    expect(state.solvedAt).toBe(8_000);
    expect(getStars(demoLevel, state)).toBe(3);
  });

  test("hint reveals one stable coupling instead of incrementing solution layers", () => {
    const state = createRuntimeState(demoLevel, 1_000);
    const hinted = reducer(state, demoLevel, { type: "requestHint" });
    const repeated = reducer(hinted, demoLevel, { type: "requestHint" });

    expect(hinted.hintedCoupling).toEqual(getFirstCouplingEdge(demoLevel));
    expect(hinted.hintCount).toBe(1);
    expect(hinted.highlightedRing).toBe(hinted.hintedCoupling?.visualRing);
    expect(repeated.hintedCoupling).toEqual(hinted.hintedCoupling);
    expect(repeated.hintCount).toBe(1);
  });
});
