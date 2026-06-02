import type { DifficultyConfig, DifficultyScore } from "../state/types";
import { cyclicDistance, modNorm } from "./mod";

export const DIFFICULTY_CONFIGS: Record<string, DifficultyConfig> = {
  beginner: {
    n: 3,
    q: 8,
    factorSet: [1],
    minEdges: 0,
    maxEdges: 1,
    maxOutDegree: 1,
    bounds: {
      T: [2, 8],
      G: [1, 3],
      X: [1, 10],
      GX: [1, 3],
      F: [0, 1],
      I: [0, 1],
      WF: [0, 1],
      WI: [0, 1],
      maxOutDegree: [0, 1],
      maxInDegree: [0, 1],
      graphDepth: [0, 1],
    },
  },
  easy: {
    n: 4,
    q: 8,
    factorSet: [-1, 1],
    minEdges: 1,
    maxEdges: 3,
    maxOutDegree: 2,
    bounds: {
      T: [5, 12],
      G: [2, 4],
      X: [3, 16],
      GX: [2, 4],
      F: [1, 3],
      I: [1, 5],
      WF: [1, 3],
      WI: [1, 8],
      maxOutDegree: [1, 2],
      maxInDegree: [0, 3],
      graphDepth: [1, 3],
    },
  },
  medium: {
    n: 5,
    q: 12,
    factorSet: [-2, -1, 1, 2],
    minEdges: 4,
    maxEdges: 7,
    maxOutDegree: 3,
    bounds: {
      T: [12, 22],
      G: [3, 5],
      X: [8, 26],
      GX: [3, 5],
      F: [4, 7],
      I: [4, 12],
      WF: [4, 14],
      WI: [4, 30],
      maxOutDegree: [1, 3],
      maxInDegree: [0, 4],
      graphDepth: [2, 4],
    },
  },
  hard: {
    n: 6,
    q: 12,
    factorSet: [-3, -2, -1, 1, 2, 3],
    minEdges: 8,
    maxEdges: 12,
    maxOutDegree: 3,
    bounds: {
      T: [22, 28],
      G: [5, 6],
      X: [18, 32],
      GX: [5, 6],
      F: [8, 12],
      I: [10, 14],
      WF: [18, 35],
      WI: [25, 55],
      maxOutDegree: [1, 3],
      maxInDegree: [0, 5],
      graphDepth: [3, 5],
    },
  },
  expert: {
    n: 7,
    q: 12,
    factorSet: [-3, -2, -1, 1, 2, 3],
    minEdges: 10,
    maxEdges: 15,
    maxOutDegree: 4,
    bounds: {
      T: [26, 36],
      G: [6, 7],
      X: [22, 42],
      GX: [6, 7],
      F: [10, 15],
      I: [12, 24],
      WF: [22, 45],
      WI: [30, 80],
      maxOutDegree: [2, 4],
      maxInDegree: [0, 6],
      graphDepth: [3, 6],
    },
  },
};

export type ScoreDifficultyInput = {
  matrix: number[][];
  inverseMatrix: number[][];
  solution: number[];
  initialOffsets: number[];
  q: number;
};

function nonzeroOffDiagonalEntries(matrix: number[][], q: number): Array<[number, number, number]> {
  const entries: Array<[number, number, number]> = [];

  for (let row = 0; row < matrix.length; row += 1) {
    for (let col = 0; col < (matrix[row]?.length ?? 0); col += 1) {
      if (row === col) continue;
      const value = modNorm(matrix[row]?.[col] ?? 0, q);
      if (value !== 0) entries.push([row, col, value]);
    }
  }

  return entries;
}

function longestDependencyChain(matrix: number[][], q: number): number {
  const n = matrix.length;
  const memo = Array(n).fill(undefined) as Array<number | undefined>;

  const visit = (control: number): number => {
    const cached = memo[control];
    if (cached !== undefined) return cached;

    let best = 0;
    for (let visual = control + 1; visual < n; visual += 1) {
      if (modNorm(matrix[visual]?.[control] ?? 0, q) !== 0) {
        best = Math.max(best, 1 + visit(visual));
      }
    }

    memo[control] = best;
    return best;
  };

  let best = 0;
  for (let control = 0; control < n; control += 1) {
    best = Math.max(best, visit(control));
  }
  return best;
}

export function scoreDifficulty(input: ScoreDifficultyInput): DifficultyScore {
  const { matrix, inverseMatrix, solution, initialOffsets, q } = input;
  const directEntries = nonzeroOffDiagonalEntries(matrix, q);
  const inverseEntries = nonzeroOffDiagonalEntries(inverseMatrix, q);
  const n = matrix.length;

  const outDegrees = Array(n).fill(0) as number[];
  const inDegrees = Array(n).fill(0) as number[];
  for (const [visual, control] of directEntries) {
    outDegrees[control] = (outDegrees[control] ?? 0) + 1;
    inDegrees[visual] = (inDegrees[visual] ?? 0) + 1;
  }

  return {
    T: solution.reduce((sum, value) => sum + cyclicDistance(value, q), 0),
    G: solution.filter((value) => modNorm(value, q) !== 0).length,
    X: initialOffsets.reduce((sum, value) => sum + cyclicDistance(value, q), 0),
    GX: initialOffsets.filter((value) => modNorm(value, q) !== 0).length,
    F: directEntries.length,
    I: inverseEntries.length,
    WF: directEntries.reduce((sum, [, , value]) => sum + cyclicDistance(value, q), 0),
    WI: inverseEntries.reduce((sum, [, , value]) => sum + cyclicDistance(value, q), 0),
    maxOutDegree: Math.max(0, ...outDegrees),
    maxInDegree: Math.max(0, ...inDegrees),
    graphDepth: longestDependencyChain(matrix, q),
  };
}

export function withinDifficultyBounds(
  score: DifficultyScore,
  bounds: DifficultyConfig["bounds"]
): boolean {
  return (Object.keys(bounds) as Array<keyof DifficultyScore>).every((key) => {
    const [min, max] = bounds[key];
    const value = score[key];
    return value >= min && value <= max;
  });
}
