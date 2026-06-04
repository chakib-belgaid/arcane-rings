import { inverseUnitLowerTriangular } from "../math/matrix";
import { cyclicDistance } from "../math/mod";
import type { Level } from "../game/types";

const q = 8;
const matrix = [
  [1, 0, 0, 0, 0],
  [1, 1, 0, 0, 0],
  [1, 2, 1, 0, 0],
  [0, 1, 1, 1, 0],
  [0, 0, 1, 2, 1]
];
const solution = [1, 5, 2, 3, 0];

export const demoLevel: Level = {
  id: "grove-001",
  imageId: "grove-path",
  seed: "enchanted-grove-v1",
  difficultyName: "hard",
  n: 5,
  q,
  ringRadii: [0.18, 0.34, 0.52, 0.72, 1],
  matrix,
  inverseMatrix: inverseUnitLowerTriangular(matrix, q),
  initialOffsets: [7, 2, 3, 6, 0],
  solution,
  optimalTickCost: solution.reduce((sum, value) => sum + cyclicDistance(value, q), 0),
  moveBudget: 14,
  difficulty: {
    T: 9,
    G: 4,
    X: 9,
    GX: 4,
    F: 5,
    I: 8,
    WF: 7,
    WI: 12,
    maxOutDegree: 3,
    maxInDegree: 3,
    graphDepth: 4
  },
  showReferenceThumbnail: true,
  showCouplingHints: false
};
