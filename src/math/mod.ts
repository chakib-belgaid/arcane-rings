export function modNorm(value: number, q: number): number {
  if (!Number.isInteger(q) || q <= 0) {
    throw new Error("Modulo base must be a positive integer.");
  }

  return ((value % q) + q) % q;
}

export function cyclicDistance(value: number, q: number): number {
  const normalized = modNorm(value, q);
  return Math.min(normalized, q - normalized);
}

export function shortestSignedDelta(value: number, q: number): number {
  const normalized = modNorm(value, q);
  return normalized > q / 2 ? normalized - q : normalized;
}

export function matVecMod(matrix: number[][], vector: number[], q: number): number[] {
  return matrix.map((row) =>
    modNorm(
      row.reduce((sum, value, index) => sum + value * (vector[index] ?? 0), 0),
      q
    )
  );
}

export function matMulMod(a: number[][], b: number[][], q: number): number[][] {
  const cols = b[0]?.length ?? 0;

  return a.map((row) =>
    Array.from({ length: cols }, (_, col) => {
      let total = 0;
      for (let index = 0; index < b.length; index += 1) {
        total += (row[index] ?? 0) * (b[index]?.[col] ?? 0);
      }
      return modNorm(total, q);
    })
  );
}
