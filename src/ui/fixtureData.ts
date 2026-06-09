import { CollectionItem, DifficultyTrack, LevelCard, PuzzleImageSource, PuzzleLevelFixture } from "./types";
import { WinResult } from "./screens/WinScreen";
import { generateLevel } from "../generation/levelGenerator";
import { cyclicDistance } from "../math/mod";

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

export const fixtureLevel: PuzzleLevelFixture = {
  id: "medium-01",
  imageId: "moon-gate-archive",
  title: "Moon Gate Archive",
  difficulty: "medium",
  rings: 5,
  ticks: 12,
  moves: 7,
  initialOffsets: [11, 0, 4, 3, 2],
  solution: [1, -2, -3, 1, 0],
  showReferenceThumbnail: true,
  showCouplingHints: true,
  edges: [
    { controlRing: 1, visualRing: 2, factor: 2 },
    { controlRing: 1, visualRing: 3, factor: -1 },
    { controlRing: 2, visualRing: 4, factor: 2 },
    { controlRing: 4, visualRing: 5, factor: -2 },
  ],
};

type GeneratedPuzzleSpec = {
  difficulty: "easy" | "medium" | "hard";
  slug: string;
  title: string;
};

const generatedPuzzleSpecs: GeneratedPuzzleSpec[] = [
  { difficulty: "easy", slug: "sunlit-glasshouse", title: "Sunlit Glasshouse" },
  { difficulty: "easy", slug: "clockwork-lily-pond", title: "Clockwork Lily Pond" },
  { difficulty: "easy", slug: "amber-library-nook", title: "Amber Library Nook" },
  { difficulty: "easy", slug: "lantern-market-circle", title: "Lantern Market Circle" },
  { difficulty: "easy", slug: "crystal-tea-garden", title: "Crystal Tea Garden" },
  { difficulty: "easy", slug: "sunny-meadow-path", title: "Sunny Meadow Path" },
  { difficulty: "easy", slug: "pebble-moon-pond", title: "Pebble Moon Pond" },
  { difficulty: "easy", slug: "cozy-hearth-kitchen", title: "Cozy Hearth Kitchen" },
  { difficulty: "easy", slug: "blue-tile-courtyard", title: "Blue Tile Courtyard" },
  { difficulty: "easy", slug: "lantern-bridge", title: "Lantern Bridge" },
  { difficulty: "easy", slug: "apple-orchard-gate", title: "Apple Orchard Gate" },
  { difficulty: "easy", slug: "shell-fountain-plaza", title: "Shell Fountain Plaza" },
  { difficulty: "easy", slug: "honeycomb-conservatory", title: "Honeycomb Conservatory" },
  { difficulty: "easy", slug: "willow-tea-terrace", title: "Willow Tea Terrace" },
  { difficulty: "easy", slug: "cloudstep-patio", title: "Cloudstep Patio" },
  { difficulty: "medium", slug: "sapphire-astral-orrery", title: "Sapphire Astral Orrery" },
  { difficulty: "medium", slug: "verdant-rail-conservatory", title: "Verdant Rail Conservatory" },
  { difficulty: "medium", slug: "tideglass-atrium", title: "Tideglass Atrium" },
  { difficulty: "medium", slug: "ember-cartographer-hall", title: "Ember Cartographer Hall" },
  { difficulty: "medium", slug: "frost-lantern-causeway", title: "Frost Lantern Causeway" },
  { difficulty: "hard", slug: "obsidian-star-forge", title: "Obsidian Star Forge" },
  { difficulty: "hard", slug: "tempest-observatory", title: "Tempest Observatory" },
  { difficulty: "hard", slug: "crimson-gear-cathedral", title: "Crimson Gear Cathedral" },
  { difficulty: "hard", slug: "eclipsed-coral-vault", title: "Eclipsed Coral Vault" },
  { difficulty: "hard", slug: "arcane-glacier-engine", title: "Arcane Glacier Engine" },
];

export const generatedImagePresets: PuzzleImageSource[] = generatedPuzzleSpecs.map((spec) => ({
  id: spec.slug,
  title: spec.title,
  src: `/presets/generated/${spec.slug}.png`,
  source: "preset",
  stars: 0,
  difficulty: spec.difficulty,
  bestMoves: null,
  unlockedAt: "Default",
}));

export const defaultImagePresets: PuzzleImageSource[] = [
  {
    id: "moon-gate-archive",
    title: "Moon Gate Archive",
    src: "/presets/moon-gate-archive.png",
    source: "preset",
    stars: 3,
    difficulty: "medium",
    bestMoves: 24,
    unlockedAt: "2026-06-02",
  },
  {
    id: "solar-greenhouse-observatory",
    title: "Solar Greenhouse Observatory",
    src: "/presets/solar-greenhouse-observatory.png",
    source: "preset",
    stars: 0,
    difficulty: "easy",
    bestMoves: null,
    unlockedAt: "Default",
  },
  {
    id: "neon-tidal-city",
    title: "Neon Tidal City",
    src: "/presets/neon-tidal-city.png",
    source: "preset",
    stars: 0,
    difficulty: "hard",
    bestMoves: null,
    unlockedAt: "Default",
  },
  ...generatedImagePresets,
];

function edgeListFromMatrix(matrix: number[][]) {
  return matrix.flatMap((row, visualRing) =>
    row.flatMap((factor, controlRing) => {
      if (visualRing <= controlRing || factor === 0) {
        return [];
      }

      return [{ controlRing: controlRing + 1, visualRing: visualRing + 1, factor }];
    })
  );
}

function solutionTickCost(solution: number[], ticks: number) {
  return solution.reduce((sum, value) => sum + cyclicDistance(value, ticks), 0);
}

export const generatedPuzzleLevels: PuzzleLevelFixture[] = generatedPuzzleSpecs.map((spec) => {
  const id = `${spec.difficulty}-${spec.slug}`;
  const generated = generateLevel({
    id,
    imageId: spec.slug,
    seed: `catalog-${id}`,
    difficultyName: spec.difficulty,
    showReferenceThumbnail: true,
    showCouplingHints: spec.difficulty !== "hard",
  });

  return {
    id,
    imageId: spec.slug,
    title: spec.title,
    difficulty: spec.difficulty,
    rings: generated.n,
    ticks: generated.q,
    moves: solutionTickCost(generated.solution, generated.q),
    initialOffsets: generated.initialOffsets,
    solution: generated.solution,
    showReferenceThumbnail: generated.showReferenceThumbnail,
    showCouplingHints: generated.showCouplingHints,
    edges: edgeListFromMatrix(generated.matrix),
  };
});

export const puzzleLevels: PuzzleLevelFixture[] = [fixtureLevel, ...generatedPuzzleLevels];

const imageById = new Map(defaultImagePresets.map((image) => [image.id, image]));

export const levelCards: LevelCard[] = puzzleLevels.map((level) => ({
  id: level.id,
  title: level.title,
  difficulty: level.difficulty,
  imageSrc: imageById.get(level.imageId)?.src,
  rings: level.rings,
  ticks: level.ticks,
  bestStars: level.id === fixtureLevel.id ? 3 : 0,
  bestMoves: level.id === fixtureLevel.id ? 24 : null,
  hintsAvailable: level.showCouplingHints,
  locked: false,
}));

export const collectionItems: CollectionItem[] = defaultImagePresets;

export const winResult: WinResult = {
  title: "Moon Gate Restored",
  stars: 3,
  moveCount: 18,
  playerTickCost: 24,
  optimalTickCost: 22,
  elapsedTime: "04:18",
  elapsedMs: 258000,
  hintCount: 1,
  difficultyScore: "Medium · T22 · F6",
  bestScore: "18 moves · 24 ticks · 04:18",
  bestMoveCount: 18,
  bestTickCost: 24,
  bestElapsedTime: "04:18",
  isPersonalBest: true,
};
