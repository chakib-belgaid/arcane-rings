import type { DifficultyConfig } from "../state/types";
import type { Rng } from "./rng";

export function generateTriangularMatrix(config: DifficultyConfig, rng: Rng): number[][] {
  const { n, factorSet, minEdges, maxEdges, maxOutDegree } = config;
  const matrix: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))
  );

  const possibleEdges: Array<[visual: number, control: number]> = [];
  for (let control = 0; control < n; control += 1) {
    for (let visual = control + 1; visual < n; visual += 1) {
      possibleEdges.push([visual, control]);
    }
  }

  rng.shuffle(possibleEdges);
  const targetEdges = rng.int(minEdges, maxEdges);
  const outDegree = Array(n).fill(0) as number[];
  let added = 0;

  for (const [visual, control] of possibleEdges) {
    if (added >= targetEdges) break;
    if ((outDegree[control] ?? 0) >= maxOutDegree) continue;

    matrix[visual]![control] = rng.pick(factorSet);
    outDegree[control] = (outDegree[control] ?? 0) + 1;
    added += 1;
  }

  return matrix;
}
