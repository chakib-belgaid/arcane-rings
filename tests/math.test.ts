import { describe, expect, test } from "vitest";
import fc from "fast-check";
import { cyclicDistance, modNorm } from "../src/math/mod";
import {
  inverseUnitLowerTriangular,
  matMulMod,
  matVecMod,
} from "../src/math/matrix";

const identity = (n: number) =>
  Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))
  );

describe("core modular math", () => {
  test("modNorm normalizes negative and positive values", () => {
    expect(modNorm(-1, 12)).toBe(11);
    expect(modNorm(-25, 12)).toBe(11);
    expect(modNorm(25, 12)).toBe(1);
    expect(modNorm(12, 12)).toBe(0);
  });

  test("cyclicDistance returns the shortest distance for all ticks", () => {
    fc.assert(
      fc.property(fc.integer({ min: -200, max: 200 }), (value) => {
        const distance = cyclicDistance(value, 12);
        expect(distance).toBeGreaterThanOrEqual(0);
        expect(distance).toBeLessThanOrEqual(6);
        expect(distance).toBe(cyclicDistance(-value, 12));
      })
    );
  });

  test("matVecMod and matMulMod normalize all results", () => {
    expect(
      matVecMod(
        [
          [1, -2, 5],
          [4, 1, -3],
        ],
        [10, 7, 4],
        12
      )
    ).toEqual([4, 11]);

    expect(
      matMulMod(
        [
          [1, -2],
          [4, 1],
        ],
        [
          [5, 6],
          [-3, 8],
        ],
        12
      )
    ).toEqual([
      [11, 2],
      [5, 8],
    ]);
  });

  test("inverseUnitLowerTriangular satisfies A * B = I mod q", () => {
    const matrix = [
      [1, 0, 0, 0],
      [2, 1, 0, 0],
      [-1, 3, 1, 0],
      [0, -2, 1, 1],
    ];

    const inverse = inverseUnitLowerTriangular(matrix, 12);

    expect(matMulMod(matrix, inverse, 12)).toEqual(identity(4));
    expect(matMulMod(inverse, matrix, 12)).toEqual(identity(4));
  });
});
