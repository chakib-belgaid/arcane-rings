import { describe, expect, it } from "vitest";
import { createPlaceholderRuntimeState, seedPlaceholderLevel } from "../../src/state/placeholderGameState";

describe("placeholder game state", () => {
  it("creates a deterministic seed level with app-shell contracts", () => {
    const first = seedPlaceholderLevel("app-shell-v1");
    const second = seedPlaceholderLevel("app-shell-v1");

    expect(first).toEqual(second);
    expect(first.n).toBe(4);
    expect(first.matrix).toHaveLength(first.n);
    expect(first.ringRadii).toHaveLength(first.n + 1);
    expect(first.showCouplingHints).toBe(true);
  });

  it("creates runtime state from the seeded level without marking it solved", () => {
    const level = seedPlaceholderLevel("app-shell-v1");
    const state = createPlaceholderRuntimeState(level, 1000);

    expect(state.currentOffsets).toEqual(level.initialOffsets);
    expect(state.accumulatedMoves).toHaveLength(level.n);
    expect(state.moveHistory).toEqual([]);
    expect(state.isSolved).toBe(false);
    expect(state.startedAt).toBe(1000);
  });
});
