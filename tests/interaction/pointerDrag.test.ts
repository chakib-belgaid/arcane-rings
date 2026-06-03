import { describe, expect, test } from "vitest";
import {
  angleDeltaToTicks,
  angleOfPoint,
  beginPointerDrag,
  computeAffectedRings,
  finishPointerDrag,
  findRingFromPoint,
  updatePointerDrag,
  unwrapAngleDelta,
  type PointerDragSession,
} from "../../src/interaction/pointerDrag";

describe("pointer drag helpers", () => {
  test("findRingFromPoint selects the annulus containing the pointer radius", () => {
    const radii = [0, 30, 70, 120];

    expect(findRingFromPoint(160, 100, 100, 100, radii)).toBe(1);
    expect(findRingFromPoint(230, 100, 100, 100, radii)).toBeNull();
  });

  test("angle helpers unwrap and quantize drag movement into ticks", () => {
    const start = angleOfPoint(110, 100, 100, 100);
    const current = angleOfPoint(100, 110, 100, 100);
    const delta = unwrapAngleDelta(start, current);

    expect(angleDeltaToTicks(delta, 8)).toBe(2);
  });

  test("drag lifecycle previews and commits nonzero ticks for the selected ring", () => {
    const radii = [0, 40, 80, 120];
    const session = beginPointerDrag({
      px: 60,
      py: 100,
      cx: 100,
      cy: 100,
      ringRadii: radii,
      q: 8,
    });

    expect(session?.controlRing).toBe(1);
    expect(
      updatePointerDrag(session!, {
        px: 100,
        py: 60,
        cx: 100,
        cy: 100,
      }),
    ).toBe(2);
    expect(finishPointerDrag(session!)).toEqual({
      controlRing: 1,
      deltaTicks: 2,
    });
  });

  test("drag lifecycle tracks sub-tick preview motion without committing it", () => {
    const q = 8;
    const radii = [0, 40, 80, 120];
    const session = beginPointerDrag({
      px: 140,
      py: 100,
      cx: 100,
      cy: 100,
      ringRadii: radii,
      q,
    });
    const deltaAngle = ((2 * Math.PI) / q) * 0.4;

    expect(
      updatePointerDrag(session!, {
        px: 100 + Math.cos(deltaAngle) * 40,
        py: 100 + Math.sin(deltaAngle) * 40,
        cx: 100,
        cy: 100,
      }),
    ).toBe(0);
    expect((session as PointerDragSession & { previewDeltaTicks?: number })?.previewDeltaTicks).toBeCloseTo(0.4);
    expect(finishPointerDrag(session!)).toBeNull();
  });

  test("computeAffectedRings returns rows influenced by the selected control column", () => {
    const matrix = [
      [1, 0, 0],
      [1, 1, 0],
      [0, 2, 1],
    ];

    expect(computeAffectedRings(matrix, 1, 8)).toEqual([1, 2]);
  });
});
