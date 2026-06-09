import { CollectionItem, DifficultyName, DifficultyTrack, LevelCard, PuzzleImageSource, PuzzleLevelFixture } from "./types";
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

type GeneratedImageSpec = {
  slug: string;
  title: string;
};

type GeneratedPuzzleSpec = GeneratedImageSpec & {
  difficulty: DifficultyName;
  imageId?: string;
};

const generatedImageSpecs: GeneratedImageSpec[] = [
  { slug: "sunlit-glasshouse", title: "Sunlit Glasshouse" },
  { slug: "clockwork-lily-pond", title: "Clockwork Lily Pond" },
  { slug: "amber-library-nook", title: "Amber Library Nook" },
  { slug: "lantern-market-circle", title: "Lantern Market Circle" },
  { slug: "crystal-tea-garden", title: "Crystal Tea Garden" },
  { slug: "sunny-meadow-path", title: "Sunny Meadow Path" },
  { slug: "pebble-moon-pond", title: "Pebble Moon Pond" },
  { slug: "cozy-hearth-kitchen", title: "Cozy Hearth Kitchen" },
  { slug: "blue-tile-courtyard", title: "Blue Tile Courtyard" },
  { slug: "lantern-bridge", title: "Lantern Bridge" },
  { slug: "apple-orchard-gate", title: "Apple Orchard Gate" },
  { slug: "shell-fountain-plaza", title: "Shell Fountain Plaza" },
  { slug: "honeycomb-conservatory", title: "Honeycomb Conservatory" },
  { slug: "willow-tea-terrace", title: "Willow Tea Terrace" },
  { slug: "cloudstep-patio", title: "Cloudstep Patio" },
  { slug: "sapphire-astral-orrery", title: "Sapphire Astral Orrery" },
  { slug: "verdant-rail-conservatory", title: "Verdant Rail Conservatory" },
  { slug: "tideglass-atrium", title: "Tideglass Atrium" },
  { slug: "ember-cartographer-hall", title: "Ember Cartographer Hall" },
  { slug: "frost-lantern-causeway", title: "Frost Lantern Causeway" },
  { slug: "obsidian-star-forge", title: "Obsidian Star Forge" },
  { slug: "tempest-observatory", title: "Tempest Observatory" },
  { slug: "crimson-gear-cathedral", title: "Crimson Gear Cathedral" },
  { slug: "eclipsed-coral-vault", title: "Eclipsed Coral Vault" },
  { slug: "arcane-glacier-engine", title: "Arcane Glacier Engine" },
];

const generatedPuzzleSpecs: GeneratedPuzzleSpec[] = [
  { difficulty: "beginner", slug: "glasshouse-primer", title: "Glasshouse Primer", imageId: "sunlit-glasshouse" },
  { difficulty: "beginner", slug: "lily-pond-primer", title: "Lily Pond Primer", imageId: "clockwork-lily-pond" },
  { difficulty: "beginner", slug: "library-primer", title: "Library Primer", imageId: "amber-library-nook" },
  { difficulty: "beginner", slug: "market-primer", title: "Market Primer", imageId: "lantern-market-circle" },
  { difficulty: "beginner", slug: "tea-garden-primer", title: "Tea Garden Primer", imageId: "crystal-tea-garden" },
  ...generatedImageSpecs.slice(0, 15).map((spec) => ({ ...spec, difficulty: "easy" as const })),
  ...generatedImageSpecs.slice(15, 20).map((spec) => ({ ...spec, difficulty: "medium" as const })),
  ...generatedImageSpecs.slice(20, 25).map((spec) => ({ ...spec, difficulty: "hard" as const })),
  { difficulty: "expert", slug: "star-forge-crucible", title: "Star Forge Crucible", imageId: "obsidian-star-forge" },
  { difficulty: "expert", slug: "tempest-crucible", title: "Tempest Crucible", imageId: "tempest-observatory" },
  { difficulty: "expert", slug: "gear-cathedral-crucible", title: "Gear Cathedral Crucible", imageId: "crimson-gear-cathedral" },
  { difficulty: "expert", slug: "coral-vault-crucible", title: "Coral Vault Crucible", imageId: "eclipsed-coral-vault" },
  { difficulty: "expert", slug: "glacier-engine-crucible", title: "Glacier Engine Crucible", imageId: "arcane-glacier-engine" },
];

export const generatedImagePresets: PuzzleImageSource[] = generatedImageSpecs.map((spec, index) => ({
  id: spec.slug,
  title: spec.title,
  src: `/presets/generated/${spec.slug}.png`,
  source: "preset",
  stars: 0,
  difficulty: index < 15 ? "easy" : index < 20 ? "medium" : "hard",
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
  const imageId = spec.imageId ?? spec.slug;
  const generated = generateLevel({
    id,
    imageId,
    seed: `catalog-${id}`,
    difficultyName: spec.difficulty,
    showReferenceThumbnail: true,
    showCouplingHints: spec.difficulty !== "hard",
  });

  return {
    id,
    imageId,
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
