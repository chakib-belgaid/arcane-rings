export function balancedRingRadii(radius: number, n: number, power = 0.85): number[] {
  if (radius <= 0) {
    throw new Error("radius must be positive");
  }

  if (!Number.isInteger(n) || n <= 0) {
    throw new Error("ring count must be a positive integer");
  }

  return Array.from({ length: n + 1 }, (_, i) => radius * (i / n) ** power);
}

export function equalRingRadii(radius: number, n: number): number[] {
  if (radius <= 0) {
    throw new Error("radius must be positive");
  }

  if (!Number.isInteger(n) || n <= 0) {
    throw new Error("ring count must be a positive integer");
  }

  return Array.from({ length: n + 1 }, (_, i) => (radius * i) / n);
}
