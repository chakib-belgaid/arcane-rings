import { modNorm } from "../math/mod";
import type { DifficultyConfig } from "../state/types";
import type { Rng } from "./rng";

function activeCount(values: readonly number[]): number {
  return values.filter((value) => value !== 0).length;
}

export function sampleSolution(config: DifficultyConfig, rng: Rng): number[] {
  const { n, q } = config;
  const [minT, maxT] = config.bounds.T;
  const [minG, maxG] = config.bounds.G;
  const maxDistance = Math.floor(q / 2);

  for (let attempt = 0; attempt < 500; attempt += 1) {
    const target = rng.int(minT, maxT);
    const distances = Array(n).fill(0) as number[];
    const ringOrder = rng.shuffle(Array.from({ length: n }, (_, i) => i));
    const targetActive = rng.int(Math.max(1, minG), Math.min(n, maxG));

    let remaining = target;
    for (let index = 0; index < targetActive; index += 1) {
      const ring = ringOrder[index]!;
      const slotsLeft = targetActive - index - 1;
      const minForRest = slotsLeft;
      const maxForThis = Math.min(maxDistance, remaining - minForRest);
      if (maxForThis < 1) break;

      const distance =
        index === targetActive - 1 ? remaining : rng.int(1, maxForThis);
      distances[ring] = distance;
      remaining -= distance;
    }

    if (remaining !== 0) continue;
    const active = activeCount(distances);
    if (active < minG || active > maxG) continue;

    return distances.map((distance) => {
      if (distance === 0) return 0;
      const sign = rng.pick([-1, 1]);
      return modNorm(sign * distance, q);
    });
  }

  throw new Error("Unable to sample solution inside difficulty bounds");
}
