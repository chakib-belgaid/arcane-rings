import { describe, expect, test } from "vitest";
import { matMulMod, matVecMod } from "../src/math/matrix";
import { modNorm } from "../src/math/mod";
import { DIFFICULTY_CONFIGS, scoreDifficulty, withinDifficultyBounds } from "../src/math/difficulty";
import {
  createSeededRng,
  generateLevel,
  generateTriangularMatrix,
  sampleSolution,
} from "../src/generation/levelGenerator";
import { generateLevelFixture, LEVELS_PER_DIFFICULTY } from "../src/ui/levelAdapter";
import type { DifficultyConfig, DifficultyName } from "../src/state/types";

const TEST_CONFIG: DifficultyConfig = {
  n: 4,
  q: 12,
  factorSet: [-2, -1, 1, 2],
  minEdges: 2,
  maxEdges: 4,
  maxOutDegree: 2,
  bounds: {
    T: [4, 14],
    G: [2, 4],
    X: [1, 24],
    GX: [1, 4],
    F: [2, 4],
    I: [2, 8],
    WF: [2, 12],
    WI: [2, 24],
    maxOutDegree: [1, 2],
    maxInDegree: [0, 3],
    graphDepth: [1, 3],
  },
};

describe("level generation", () => {
  test("generateTriangularMatrix creates V1 unit lower-triangular matrices", () => {
    const matrix = generateTriangularMatrix(TEST_CONFIG, createSeededRng("matrix"));

    for (let row = 0; row < TEST_CONFIG.n; row += 1) {
      expect(matrix[row]?.[row]).toBe(1);
      for (let col = row + 1; col < TEST_CONFIG.n; col += 1) {
        expect(matrix[row]?.[col]).toBe(0);
      }
    }
  });

  test("sampleSolution produces active moves inside difficulty bounds", () => {
    const solution = sampleSolution(TEST_CONFIG, createSeededRng("solution"));
    const distances = solution.map((value) => Math.min(value, TEST_CONFIG.q - value));
    const total = distances.reduce((sum, value) => sum + value, 0);
    const active = solution.filter((value) => value !== 0).length;

    expect(total).toBeGreaterThanOrEqual(TEST_CONFIG.bounds.T[0]);
    expect(total).toBeLessThanOrEqual(TEST_CONFIG.bounds.T[1]);
    expect(active).toBeGreaterThanOrEqual(TEST_CONFIG.bounds.G[0]);
    expect(active).toBeLessThanOrEqual(TEST_CONFIG.bounds.G[1]);
  });

  test("generateLevel is deterministic and returns an accepted solvable level", () => {
    const first = generateLevel({
      id: "test-level",
      imageId: "test-image",
      seed: "same-seed",
      difficultyName: "medium",
      config: TEST_CONFIG,
    });
    const second = generateLevel({
      id: "test-level",
      imageId: "test-image",
      seed: "same-seed",
      difficultyName: "medium",
      config: TEST_CONFIG,
    });

    expect(second).toEqual(first);
    expect(first.initialOffsets.some((value) => value !== 0)).toBe(true);
    expect(
      first.initialOffsets.map((offset, i) =>
        modNorm(offset + matVecMod(first.matrix, first.solution, first.q)[i]!, first.q)
      )
    ).toEqual(Array(TEST_CONFIG.n).fill(0));
    expect(matMulMod(first.matrix, first.inverseMatrix, first.q)).toEqual(
      Array.from({ length: TEST_CONFIG.n }, (_, i) =>
        Array.from({ length: TEST_CONFIG.n }, (_, j) => (i === j ? 1 : 0))
      )
    );
    expect(withinDifficultyBounds(first.difficulty, TEST_CONFIG.bounds)).toBe(true);
    expect(
      scoreDifficulty({
        matrix: first.matrix,
        inverseMatrix: first.inverseMatrix,
        solution: first.solution,
        initialOffsets: first.initialOffsets,
        q: first.q,
      })
    ).toEqual(first.difficulty);
  });
});

describe("production level catalog balance", () => {
  const difficulties: DifficultyName[] = ["beginner", "easy", "medium", "hard", "expert"];

  for (const difficulty of difficulties) {
    const config = DIFFICULTY_CONFIGS[difficulty]!;

    test(`all ${LEVELS_PER_DIFFICULTY} ${difficulty} levels are solvable and within bounds`, () => {
      for (let i = 0; i < LEVELS_PER_DIFFICULTY; i++) {
        const fixture = generateLevelFixture(difficulty, i);

        // Ring and tick counts match difficulty config
        expect(fixture.rings, `level ${i} rings`).toBe(config.n);
        expect(fixture.ticks, `level ${i} ticks`).toBe(config.q);

        // Applying solution must zero out all offsets
        const offsets = [...fixture.initialOffsets];
        const matrix: number[][] = Array.from({ length: fixture.rings }, (_, row) =>
          Array.from({ length: fixture.rings }, (_, col) => (row === col ? 1 : 0))
        );
        for (const edge of fixture.edges) {
          const v = edge.visualRing - 1;
          const c = edge.controlRing - 1;
          if (matrix[v] !== undefined) matrix[v]![c] = edge.factor;
        }
        const applied = matVecMod(matrix, fixture.solution, fixture.ticks);
        const result = offsets.map((o, i) => modNorm(o + (applied[i] ?? 0), fixture.ticks));
        expect(result, `level ${i} solution zeroes offsets`).toEqual(Array(fixture.rings).fill(0));

        // Puzzle is not trivially pre-solved
        expect(fixture.initialOffsets.some((o) => o !== 0), `level ${i} starts scrambled`).toBe(true);
      }
    });
  }

  test("all 30 catalog levels have distinct ids", () => {
    const ids = difficulties.flatMap((d) =>
      Array.from({ length: LEVELS_PER_DIFFICULTY }, (_, i) => generateLevelFixture(d, i).id)
    );
    expect(new Set(ids).size).toBe(difficulties.length * LEVELS_PER_DIFFICULTY);
  });

  test("easy levels have more coupling than beginner", () => {
    const begEdges = Array.from({ length: LEVELS_PER_DIFFICULTY }, (_, i) =>
      generateLevelFixture("beginner", i).edges.length
    );
    const easyEdges = Array.from({ length: LEVELS_PER_DIFFICULTY }, (_, i) =>
      generateLevelFixture("easy", i).edges.length
    );
    const avgBeg = begEdges.reduce((a, b) => a + b, 0) / LEVELS_PER_DIFFICULTY;
    const avgEasy = easyEdges.reduce((a, b) => a + b, 0) / LEVELS_PER_DIFFICULTY;
    expect(avgEasy).toBeGreaterThan(avgBeg);
  });
});
