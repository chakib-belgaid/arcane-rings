export type DifficultyName = "beginner" | "easy" | "medium" | "hard" | "expert";

export type DifficultyScore = {
  T: number;
  G: number;
  X: number;
  GX: number;
  F: number;
  I: number;
  WF: number;
  WI: number;
  maxOutDegree: number;
  maxInDegree: number;
  graphDepth: number;
};

export type Level = {
  id: string;
  imageId: string;
  seed: string;
  difficultyName: DifficultyName;
  n: number;
  q: number;
  ringRadii: number[];
  matrix: number[][];
  inverseMatrix: number[][];
  initialOffsets: number[];
  solution: number[];
  optimalTickCost: number;
  moveBudget: number;
  difficulty: DifficultyScore;
  showReferenceThumbnail: boolean;
  showCouplingHints: boolean;
};

export type PlayerMove = {
  controlRing: number;
  deltaTicks: number;
  affectedDelta: number[];
  createdAt: number;
};

export type RuntimeState = {
  accumulatedMoves: number[];
  moveHistory: PlayerMove[];
  totalTickMoves: number;
  selectedRing: number | null;
  previewTicks: number;
  isSolved: boolean;
  startedAt: number;
  solvedAt: number | null;
  hintCount: number;
  highlightedRing: number | null;
};

export type GameAction =
  | { type: "selectRing"; ring: number | null }
  | { type: "previewRotation"; controlRing: number; deltaTicks: number }
  | { type: "commitRotation"; controlRing: number; deltaTicks: number; now?: number }
  | { type: "undo" }
  | { type: "requestHint" }
  | { type: "restart"; now: number }
  | { type: "completeIfSolved"; now: number };
