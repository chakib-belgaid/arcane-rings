export function assertPositiveModulus(q: number): void {
  if (!Number.isInteger(q) || q <= 0) {
    throw new RangeError(`Modulus must be a positive integer, received ${q}`);
  }
}

export function modNorm(value: number, q: number): number {
  assertPositiveModulus(q);
  return ((value % q) + q) % q;
}

export function cyclicDistance(value: number, q: number): number {
  const x = modNorm(value, q);
  return Math.min(x, q - x);
}

export function shortestSignedDelta(value: number, q: number): number {
  const normalized = modNorm(value, q);
  return normalized <= q / 2 ? normalized : normalized - q;
}
