import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

import { generatedImagePresets, generatedPuzzleLevels } from "../src/ui/fixtureData";
import { inverseUnitLowerTriangular, matVecMod } from "../src/math/matrix";
import { DIFFICULTY_CONFIGS, scoreDifficulty, withinDifficultyBounds } from "../src/math/difficulty";
import { cyclicDistance, modNorm } from "../src/math/mod";
import type { PuzzleLevelFixture } from "../src/ui/types";

function matrixFromFixture(level: PuzzleLevelFixture): number[][] {
  const matrix = Array.from({ length: level.rings }, (_, row) =>
    Array.from({ length: level.rings }, (_, column) => (row === column ? 1 : 0))
  );

  for (const edge of level.edges) {
    matrix[edge.visualRing - 1]![edge.controlRing - 1] = edge.factor;
  }

  return matrix;
}

function optimalTickCost(level: PuzzleLevelFixture): number {
  return level.solution.reduce((sum, value) => sum + cyclicDistance(value, level.ticks), 0);
}

describe("generated puzzle catalog", () => {
  test("contains the generated playable puzzle set", () => {
    expect(generatedPuzzleLevels).toHaveLength(25);
    expect(generatedImagePresets).toHaveLength(25);
    expect(new Set(generatedPuzzleLevels.map((level) => level.id)).size).toBe(25);
    expect(new Set(generatedPuzzleLevels.map((level) => level.imageId)).size).toBe(25);

    expect(generatedPuzzleLevels.filter((level) => level.difficulty === "easy")).toHaveLength(15);
    expect(generatedPuzzleLevels.filter((level) => level.difficulty === "medium")).toHaveLength(5);
    expect(generatedPuzzleLevels.filter((level) => level.difficulty === "hard")).toHaveLength(5);
  });

  test("has project-local image files for every generated puzzle", () => {
    for (const image of generatedImagePresets) {
      expect(existsSync(join(process.cwd(), "public", image.src))).toBe(true);
    }
  });

  test("keeps every generated fixture solvable and inside its difficulty bounds", () => {
    for (const level of generatedPuzzleLevels) {
      const matrix = matrixFromFixture(level);
      const solvedOffsets = level.initialOffsets.map((offset, index) =>
        modNorm(offset + matVecMod(matrix, level.solution, level.ticks)[index]!, level.ticks)
      );

      expect(solvedOffsets).toEqual(Array(level.rings).fill(0));
      expect(level.moves).toBe(optimalTickCost(level));

      const difficulty = scoreDifficulty({
        matrix,
        inverseMatrix: inverseUnitLowerTriangular(matrix, level.ticks),
        solution: level.solution,
        initialOffsets: level.initialOffsets,
        q: level.ticks,
      });

      expect(withinDifficultyBounds(difficulty, DIFFICULTY_CONFIGS[level.difficulty].bounds)).toBe(true);
    }
  });
});
