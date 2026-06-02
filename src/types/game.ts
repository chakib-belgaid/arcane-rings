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
  difficulty: DifficultyScore;
  showReferenceThumbnail: boolean;
  showCouplingHints: boolean;
};

export type RuntimeState = {
  currentOffsets: number[];
  accumulatedMoves: number[];
  moveHistory: PlayerMove[];
  totalTickMoves: number;
  selectedRing: number | null;
  previewTicks: number;
  isSolved: boolean;
  startedAt: number;
  solvedAt: number | null;
};

export type PlayerMove = {
  controlRing: number;
  deltaTicks: number;
  affectedDelta: number[];
  createdAt: number;
};

export type GameAction =
  | "rotate-preview"
  | "rotate-commit"
  | "undo"
  | "hint"
  | "restart"
  | "pause"
  | "open-coupling-map"
  | "toggle-reference"
  | "confirm"
  | "cancel";

export type LevelProgress = {
  levelId: string;
  solved: boolean;
  bestStars: 0 | 1 | 2 | 3;
  bestMoveCount: number | null;
  bestTimeMs: number | null;
  completedAt: string | null;
};

export type DailyProgress = {
  dateKey: string;
  levelId: string;
  solved: boolean;
  stars: 0 | 1 | 2 | 3;
  moveCount: number | null;
  timeMs: number | null;
};

export type UserSettings = {
  reducedMotion: boolean;
  soundEffects: boolean;
  music: boolean;
  hapticFeedback: boolean;
  showReferenceThumbnail: boolean;
  highContrastRingBorders: boolean;
  colorblindFriendlyCouplingSigns: boolean;
};

export type SaveData = {
  schemaVersion: 1;
  settings: UserSettings;
  levelProgress: Record<string, LevelProgress>;
  dailyProgress: Record<string, DailyProgress>;
  unlockedImageIds: string[];
};
