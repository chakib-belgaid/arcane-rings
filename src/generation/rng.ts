import seedrandom from "seedrandom";

export type Rng = {
  next(): number;
  int(min: number, max: number): number;
  pick<T>(values: readonly T[]): T;
  shuffle<T>(values: T[]): T[];
};

export function createSeededRng(seed: string): Rng {
  const generator = seedrandom(seed);

  const next = () => generator.quick();

  return {
    next,
    int(min: number, max: number): number {
      if (!Number.isInteger(min) || !Number.isInteger(max) || min > max) {
        throw new RangeError(`Invalid integer range ${min}..${max}`);
      }
      return Math.floor(next() * (max - min + 1)) + min;
    },
    pick<T>(values: readonly T[]): T {
      if (values.length === 0) {
        throw new RangeError("Cannot pick from an empty array");
      }
      return values[Math.floor(next() * values.length)]!;
    },
    shuffle<T>(values: T[]): T[] {
      for (let i = values.length - 1; i > 0; i -= 1) {
        const j = Math.floor(next() * (i + 1));
        [values[i], values[j]] = [values[j]!, values[i]!];
      }
      return values;
    },
  };
}
