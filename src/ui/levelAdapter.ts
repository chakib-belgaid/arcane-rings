import { DIFFICULTY_CONFIGS } from "../math/difficulty";
import { generateLevel } from "../generation/levelGenerator";
import { cyclicDistance } from "../math/mod";
import type { DifficultyName as StateDifficultyName } from "../state/types";
import type { CouplingEdge, DifficultyName, PuzzleLevelFixture } from "./types";

export const LEVELS_PER_DIFFICULTY = 6;

const PRESET_IMAGE_IDS = [
  "moon-gate-archive",
  "solar-greenhouse-observatory",
  "neon-tidal-city",
] as const;

export function levelImageId(_difficulty: DifficultyName, index: number): string {
  return PRESET_IMAGE_IDS[index % PRESET_IMAGE_IDS.length] ?? PRESET_IMAGE_IDS[0];
}

const LEVEL_NAMES: Record<DifficultyName, readonly string[]> = {
  beginner: ["Mossy Arch", "Stone Circle", "Forest Rings", "Ancient Wheel", "Ember Spiral", "Moon Pool"],
  easy: ["Copper Gate", "Silver Maze", "Amber Shrine", "Jade Portal", "Crystal Hollow", "Frost Arc"],
  medium: ["Moon Gate Archive", "Solar Causeway", "Emerald Threshold", "Veil Crossing", "Star Compass", "Tidal Mark"],
  hard: ["Storm Lattice", "Shadow Engine", "Iron Labyrinth", "Thunder Seal", "Void Meridian", "Night Forge"],
  expert: ["Abyss Codex", "Chaos Mandala", "Titan Clockwork", "Eternal Vortex", "Omega Circuit", "Void Collapse"],
};

export function levelId(difficulty: DifficultyName, index: number): string {
  return `${difficulty}-${String(index + 1).padStart(2, "0")}`;
}

export function levelTitle(difficulty: DifficultyName, index: number): string {
  return LEVEL_NAMES[difficulty]?.[index] ?? `${difficulty.charAt(0).toUpperCase()}${difficulty.slice(1)} Level ${index + 1}`;
}

export function difficultyRings(difficulty: DifficultyName): number {
  return DIFFICULTY_CONFIGS[difficulty]?.n ?? 5;
}

export function difficultyTicks(difficulty: DifficultyName): number {
  return DIFFICULTY_CONFIGS[difficulty]?.q ?? 12;
}

export function generateLevelFixture(difficulty: DifficultyName, index: number): PuzzleLevelFixture {
  const id = levelId(difficulty, index);
  const title = levelTitle(difficulty, index);
  const imageId = levelImageId(difficulty, index);

  const generated = generateLevel({
    id,
    imageId,
    seed: `${id}-v1`,
    difficultyName: difficulty as StateDifficultyName,
    showReferenceThumbnail: true,
    showCouplingHints: difficulty === "beginner" || difficulty === "easy",
  });

  const edges: CouplingEdge[] = [];
  for (let visual = 0; visual < generated.n; visual++) {
    for (let control = 0; control < generated.n; control++) {
      if (visual === control) continue;
      const factor = generated.matrix[visual]?.[control] ?? 0;
      if (factor !== 0) {
        edges.push({ controlRing: control + 1, visualRing: visual + 1, factor });
      }
    }
  }

  const moves = generated.solution.reduce(
    (sum, ticks) => sum + cyclicDistance(ticks, generated.q),
    0
  );

  return {
    id,
    imageId,
    title,
    difficulty,
    rings: generated.n,
    ticks: generated.q,
    moves,
    initialOffsets: generated.initialOffsets,
    solution: generated.solution,
    showReferenceThumbnail: generated.showReferenceThumbnail,
    showCouplingHints: generated.showCouplingHints,
    edges,
  };
}
