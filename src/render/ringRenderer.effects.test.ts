import { describe, expect, test } from "vitest";
import { demoLevel } from "../levels/demoLevel";
import { drawPuzzle, type RingRenderState } from "./ringRenderer";

type RecordedCall = {
  name: string;
  args: unknown[];
};

function createCanvasHarness() {
  const calls: RecordedCall[] = [];
  const context = {
    beginPath: () => calls.push({ name: "beginPath", args: [] }),
    arc: (...args: unknown[]) => calls.push({ name: "arc", args }),
    clearRect: (...args: unknown[]) => calls.push({ name: "clearRect", args }),
    clip: (...args: unknown[]) => calls.push({ name: "clip", args }),
    createRadialGradient: (...args: unknown[]) => {
      calls.push({ name: "createRadialGradient", args });
      return { addColorStop: (...colorArgs: unknown[]) => calls.push({ name: "addColorStop", args: colorArgs }) };
    },
    drawImage: (...args: unknown[]) => calls.push({ name: "drawImage", args }),
    ellipse: (...args: unknown[]) => calls.push({ name: "ellipse", args }),
    fill: () => calls.push({ name: "fill", args: [] }),
    moveTo: (...args: unknown[]) => calls.push({ name: "moveTo", args }),
    lineTo: (...args: unknown[]) => calls.push({ name: "lineTo", args }),
    restore: () => calls.push({ name: "restore", args: [] }),
    rotate: (...args: unknown[]) => calls.push({ name: "rotate", args }),
    save: () => calls.push({ name: "save", args: [] }),
    stroke: () => calls.push({ name: "stroke", args: [] }),
    translate: (...args: unknown[]) => calls.push({ name: "translate", args }),
    set fillStyle(_value: unknown) {},
    set globalAlpha(_value: unknown) {},
    set lineCap(_value: unknown) {},
    set lineWidth(_value: unknown) {},
    set shadowBlur(_value: unknown) {},
    set shadowColor(_value: unknown) {},
    set strokeStyle(_value: unknown) {},
  } as unknown as CanvasRenderingContext2D;

  const canvas = {
    width: 400,
    height: 400,
    getContext: () => context,
  } as unknown as HTMLCanvasElement;

  return { calls, canvas };
}

function renderState(overrides: Partial<RingRenderState> = {}): RingRenderState {
  return {
    offsets: demoLevel.initialOffsets,
    selectedRing: null,
    affectedRings: [],
    highlightedRing: null,
    solved: false,
    highContrast: false,
    ...overrides,
  };
}

describe("ring renderer visual effects", () => {
  test("draws a visual-only commit burst without changing puzzle geometry", () => {
    const baseline = createCanvasHarness();
    const effects = createCanvasHarness();

    const baselineGeometry = drawPuzzle(
      baseline.canvas,
      {} as HTMLImageElement,
      demoLevel,
      renderState(),
    );
    const effectGeometry = drawPuzzle(
      effects.canvas,
      {} as HTMLImageElement,
      demoLevel,
      renderState({
        effects: {
          nowMs: 1_000,
          commitBurst: { ring: 2, startedAtMs: 760 },
          reducedMotion: false,
        },
      }),
    );

    expect(effectGeometry).toEqual(baselineGeometry);
    expect(effects.calls.filter((call) => call.name === "arc").length).toBeGreaterThan(
      baseline.calls.filter((call) => call.name === "arc").length,
    );
  });
});
