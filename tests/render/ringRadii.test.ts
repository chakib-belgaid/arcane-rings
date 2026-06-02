import { describe, expect, test } from "vitest";
import { balancedRingRadii, equalRingRadii } from "../../src/render/ringRadii";

describe("ring radii helpers", () => {
  test("balancedRingRadii returns n + 1 monotonic bounds ending at the radius", () => {
    const radii = balancedRingRadii(120, 4);

    expect(radii).toHaveLength(5);
    expect(radii[0]).toBe(0);
    expect(radii[4]).toBe(120);
    expect(radii[1]).toBeGreaterThan(120 / 4);

    for (let i = 1; i < radii.length; i += 1) {
      expect(radii[i]).toBeGreaterThan(radii[i - 1]);
    }
  });

  test("equalRingRadii returns equal-width ring bounds", () => {
    expect(equalRingRadii(90, 3)).toEqual([0, 30, 60, 90]);
  });
});
