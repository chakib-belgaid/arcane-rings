import fc from "fast-check";
import { describe, expect, test } from "vitest";
import { cyclicDistance, matMulMod, matVecMod, modNorm } from "./mod";
import { inverseUnitLowerTriangular } from "./matrix";

describe("modular math", () => {
  test("normalizes negative and overflowing values", () => {
    expect(modNorm(-1, 8)).toBe(7);
    expect(modNorm(17, 8)).toBe(1);
    expect(cyclicDistance(7, 8)).toBe(1);
  });

  test("multiplies matrix and vector modulo q", () => {
    expect(
      matVecMod(
        [
          [1, 2],
          [3, 4]
        ],
        [7, 6],
        8
      )
    ).toEqual([3, 5]);
  });

  test("inverts unit lower triangular matrices modulo q", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 9 }),
        fc.integer({ min: 2, max: 12 }),
        fc.array(fc.integer({ min: -3, max: 3 }), { minLength: 36, maxLength: 36 }),
        (n, q, values) => {
          const matrix = Array.from({ length: n }, (_, row) =>
            Array.from({ length: n }, (_, col) => {
              if (row === col) return 1;
              if (col < row) return modNorm(values[row * n + col] ?? 0, q);
              return 0;
            })
          );

          const inverse = inverseUnitLowerTriangular(matrix, q);
          const product = matMulMod(matrix, inverse, q);

          expect(product).toEqual(
            Array.from({ length: n }, (_, row) =>
              Array.from({ length: n }, (_, col) => (row === col ? 1 : 0))
            )
          );
        }
      )
    );
  });
});
