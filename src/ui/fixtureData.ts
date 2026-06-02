import { CollectionItem, DifficultyTrack, LevelCard, PuzzleLevelFixture } from "./types";
import { WinResult } from "./screens/WinScreen";

export const difficultyTracks: DifficultyTrack[] = [
  {
    id: "beginner",
    label: "Beginner",
    rings: "3",
    ticks: "8",
    coupling: "Independent rings",
    completed: 8,
    bestStars: 21,
  },
  {
    id: "easy",
    label: "Easy",
    rings: "4",
    ticks: "8-12",
    coupling: "Neighbor chains",
    completed: 6,
    bestStars: 15,
  },
  {
    id: "medium",
    label: "Medium",
    rings: "5",
    ticks: "12",
    coupling: "Branching DAG",
    completed: 3,
    bestStars: 8,
  },
  {
    id: "hard",
    label: "Hard",
    rings: "6",
    ticks: "12",
    coupling: "Bounded dense DAG",
    completed: 1,
    bestStars: 2,
  },
  {
    id: "expert",
    label: "Expert",
    rings: "7-8",
    ticks: "12-16",
    coupling: "Dense branching DAG",
    completed: 0,
    bestStars: 0,
  },
];

export const levelCards: LevelCard[] = [
  {
    id: "medium-01",
    title: "Moon Gate Archive",
    difficulty: "medium",
    rings: 5,
    ticks: 12,
    bestStars: 3,
    bestMoves: 24,
    hintsAvailable: true,
    locked: false,
  },
  {
    id: "medium-02",
    title: "Silver Causeway",
    difficulty: "medium",
    rings: 6,
    ticks: 12,
    bestStars: 0,
    bestMoves: null,
    hintsAvailable: false,
    locked: true,
  },
];

export const fixtureLevel: PuzzleLevelFixture = {
  id: "medium-01",
  title: "Moon Gate Archive",
  difficulty: "medium",
  rings: 5,
  ticks: 12,
  moves: 18,
  showReferenceThumbnail: true,
  showCouplingHints: true,
  edges: [
    { controlRing: 1, visualRing: 2, factor: 2 },
    { controlRing: 1, visualRing: 3, factor: -1 },
    { controlRing: 2, visualRing: 4, factor: 2 },
    { controlRing: 4, visualRing: 5, factor: -2 },
  ],
};

export const collectionItems: CollectionItem[] = [
  {
    id: "moon-gate",
    title: "Moon Gate Archive",
    stars: 3,
    difficulty: "medium",
    bestMoves: 24,
    unlockedAt: "2026-06-02",
  },
];

export const winResult: WinResult = {
  title: "Moon Gate Restored",
  stars: 3,
  playerTickCost: 24,
  optimalTickCost: 22,
  elapsedTime: "04:18",
  hintCount: 1,
  difficultyScore: "Medium · T22 · F6",
};
