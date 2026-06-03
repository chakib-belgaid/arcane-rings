import { modNorm } from "./mod";

function assertRectangularMatrix(matrix: number[][], label: string): void {
  if (matrix.length === 0) {
    throw new RangeError(`${label} must have at least one row`);
  }

  const width = matrix[0]?.length ?? 0;
  if (width === 0) {
    throw new RangeError(`${label} must have at least one column`);
  }

  for (const row of matrix) {
    if (row.length !== width) {
      throw new RangeError(`${label} must be rectangular`);
    }
  }
}

export function identityMatrix(n: number): number[][] {
  if (!Number.isInteger(n) || n <= 0) {
    throw new RangeError(`Matrix size must be a positive integer, received ${n}`);
  }

  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))
  );
}

export function matVecMod(matrix: number[][], vector: number[], q: number): number[] {
  assertRectangularMatrix(matrix, "matrix");
  if ((matrix[0]?.length ?? 0) !== vector.length) {
    throw new RangeError("Matrix column count must match vector length");
  }

  return matrix.map((row) => {
    const total = row.reduce((sum, value, j) => sum + value * (vector[j] ?? 0), 0);
    return modNorm(total, q);
  });
}

export function matMulMod(a: number[][], b: number[][], q: number): number[][] {
  assertRectangularMatrix(a, "a");
  assertRectangularMatrix(b, "b");

  const rows = a.length;
  const cols = b[0]?.length ?? 0;
  const inner = b.length;

  if ((a[0]?.length ?? 0) !== inner) {
    throw new RangeError("Left matrix column count must match right matrix row count");
  }

  return Array.from({ length: rows }, (_, i) =>
    Array.from({ length: cols }, (_, j) => {
      let total = 0;
      for (let k = 0; k < inner; k += 1) {
        total += (a[i]?.[k] ?? 0) * (b[k]?.[j] ?? 0);
      }
      return modNorm(total, q);
    })
  );
}

export function inverseUnitLowerTriangular(matrix: number[][], q: number): number[][] {
  assertRectangularMatrix(matrix, "matrix");

  const n = matrix.length;
  if ((matrix[0]?.length ?? 0) !== n) {
    throw new RangeError("Matrix must be square");
  }

  for (let i = 0; i < n; i += 1) {
    if (modNorm(matrix[i]?.[i] ?? 0, q) !== 1) {
      throw new RangeError("Matrix diagonal must be 1 modulo q");
    }
    for (let j = i + 1; j < n; j += 1) {
      if (modNorm(matrix[i]?.[j] ?? 0, q) !== 0) {
        throw new RangeError("Matrix must be lower triangular");
      }
    }
  }

  const inverse = Array.from({ length: n }, () => Array(n).fill(0) as number[]);

  for (let col = 0; col < n; col += 1) {
    for (let i = 0; i < n; i += 1) {
      let value = i === col ? 1 : 0;
      for (let k = 0; k < i; k += 1) {
        value -= (matrix[i]?.[k] ?? 0) * (inverse[k]?.[col] ?? 0);
      }
      inverse[i]![col] = modNorm(value, q);
    }
  }

  return inverse;
}
