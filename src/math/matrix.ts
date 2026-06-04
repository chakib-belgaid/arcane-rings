import { modNorm } from "./mod";

export { matMulMod, matVecMod } from "./mod";

export function inverseUnitLowerTriangular(matrix: number[][], q: number): number[][] {
  const n = matrix.length;
  const inverse = Array.from({ length: n }, () => Array.from({ length: n }, () => 0));

  for (let col = 0; col < n; col += 1) {
    for (let row = 0; row < n; row += 1) {
      let value = row === col ? 1 : 0;
      for (let k = 0; k < row; k += 1) {
        value -= (matrix[row]?.[k] ?? 0) * inverse[k][col];
      }
      inverse[row][col] = modNorm(value, q);
    }
  }

  return inverse;
}
