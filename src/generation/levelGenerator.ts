import { scoreDifficulty, withinDifficultyBounds, DIFFICULTY_CONFIGS } from "../math/difficulty";
import { inverseUnitLowerTriangular, matVecMod } from "../math/matrix";
import { modNorm } from "../math/mod";
import type { DifficultyConfig, DifficultyName, Level } from "../state/types";
import { generateTriangularMatrix } from "./matrixGenerator";
import { createSeededRng } from "./rng";
import { sampleSolution } from "./solutionSampler";

export { createSeededRng } from "./rng";
export type { Rng } from "./rng";
export { generateTriangularMatrix } from "./matrixGenerator";
export { sampleSolution } from "./solutionSampler";

export type GenerateLevelInput = {
  id: string;
  imageId: string;
  seed: string;
  difficultyName: DifficultyName;
  config?: DifficultyConfig;
  maxAttempts?: number;
  showReferenceThumbnail?: boolean;
  showCouplingHints?: boolean;
};

function defaultRingRadii(n: number): number[] {
  return Array.from({ length: n + 1 }, (_, i) => i / n);
}

export function generateLevel(input: GenerateLevelInput): Level {
  const config = input.config ?? DIFFICULTY_CONFIGS[input.difficultyName];
  if (!config) {
    throw new Error(`No difficulty config for ${input.difficultyName}`);
  }

  const maxAttempts = input.maxAttempts ?? 1_000;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const rng = createSeededRng(`${input.seed}:${attempt}`);
    const matrix = generateTriangularMatrix(config, rng);
    const inverseMatrix = inverseUnitLowerTriangular(matrix, config.q);
    const solution = sampleSolution(config, rng);
    const appliedSolution = matVecMod(matrix, solution, config.q);
    const initialOffsets = appliedSolution.map((value) => modNorm(-value, config.q));
    const difficulty = scoreDifficulty({
      matrix,
      inverseMatrix,
      solution,
      initialOffsets,
      q: config.q,
    });

    const isSolvedInitially = initialOffsets.every((value) => modNorm(value, config.q) === 0);
    if (isSolvedInitially) continue;
    if (!withinDifficultyBounds(difficulty, config.bounds)) continue;

    return {
      id: input.id,
      imageId: input.imageId,
      seed: input.seed,
      difficultyName: input.difficultyName,
      n: config.n,
      q: config.q,
      ringRadii: defaultRingRadii(config.n),
      matrix,
      inverseMatrix,
      initialOffsets,
      solution,
      difficulty,
      showReferenceThumbnail: input.showReferenceThumbnail ?? true,
      showCouplingHints: input.showCouplingHints ?? false,
    };
  }

  throw new Error(
    `Unable to generate accepted ${input.difficultyName} level after ${maxAttempts} attempts`
  );
}
