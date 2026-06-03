export type DifficultyName = "beginner" | "easy" | "medium" | "hard" | "expert";

export type DifficultyTrack = {
  id: DifficultyName;
  label: string;
  rings: string;
  ticks: string;
  coupling: string;
  completed: number;
  bestStars: number;
};

export type LevelCard = {
  id: string;
  title: string;
  difficulty: DifficultyName;
  rings: number;
  ticks: number;
  bestStars: number;
  bestMoves: number | null;
  hintsAvailable: boolean;
  locked: boolean;
};

export type CouplingEdge = {
  controlRing: number;
  visualRing: number;
  factor: number;
};

export type PuzzleLevelFixture = {
  id: string;
  title: string;
  difficulty: DifficultyName;
  rings: number;
  ticks: number;
  moves: number;
  initialOffsets: number[];
  solution: number[];
  showReferenceThumbnail: boolean;
  showCouplingHints: boolean;
  edges: CouplingEdge[];
};

export type PuzzleImageSource = {
  id: string;
  title: string;
  src: string;
  source: "preset" | "upload";
  stars: number;
  difficulty: DifficultyName;
  bestMoves: number | null;
  unlockedAt: string;
};

export type CollectionItem = PuzzleImageSource;
