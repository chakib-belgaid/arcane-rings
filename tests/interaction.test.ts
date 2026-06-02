import { describe, expect, test } from "vitest";
import {
  angleDeltaToTicks,
  angleOfPoint,
  findRingFromPoint,
  unwrapAngleDelta,
} from "../src/interaction/touch";

describe("ring pointer helpers", () => {
  test("findRingFromPoint returns the ring containing the pointer radius", () => {
    expect(findRingFromPoint(6, 0, 0, 0, [0, 5, 10, 15])).toBe(1);
    expect(findRingFromPoint(15, 0, 0, 0, [0, 5, 10, 15])).toBe(null);
    expect(findRingFromPoint(2, 0, 0, 0, [0, 5, 10, 15])).toBe(0);
  });

  test("angle helpers unwrap across the -pi/pi boundary and convert to ticks", () => {
    const start = angleOfPoint(-1, -0.01, 0, 0);
    const current = angleOfPoint(-1, 0.01, 0, 0);
    const delta = unwrapAngleDelta(start, current);

    expect(delta).toBeLessThan(0);
    expect(delta).toBeGreaterThan(-0.1);
    expect(angleDeltaToTicks(Math.PI / 2, 8)).toBe(2);
    expect(angleDeltaToTicks(-Math.PI / 2, 8)).toBe(-2);
  });
});
