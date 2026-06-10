import { ArrowLeft, Play, Star } from "lucide-react";

import { IconButton } from "../components/IconButton";
import { LEVELS_PER_DIFFICULTY, generateLevelFixture } from "../levelAdapter";
import { defaultImagePresets, levelCards, puzzleLevels } from "../fixtureData";
import type { DifficultyName, PuzzleLevelFixture } from "../types";

type LevelSelectionProps = {
  difficulty: DifficultyName;
  onBack: () => void;
  onStart: (level: PuzzleLevelFixture, index: number, imageId: string) => void;
};

type LevelOption = {
  level: PuzzleLevelFixture;
  index: number;
  imageSrc: string | null;
  bestStars: number;
  bestMoves: number | null;
};

const imageSourceById = new Map(defaultImagePresets.map((image) => [image.id, image.src]));
const levelCardById = new Map(levelCards.map((level) => [level.id, level]));

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function readBestStars(levelId: string): number {
  try {
    const prefix = `arcane-rings:best-score:${levelId}:`;
    let best = 0;
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key?.startsWith(prefix)) {
        const raw = window.localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw) as { moveCount?: number };
          if (typeof parsed.moveCount === "number") {
            best = Math.max(best, 1);
          }
        }
      }
    }
    return best;
  } catch {
    return 0;
  }
}

function toLevelOption(level: PuzzleLevelFixture, index: number): LevelOption {
  const levelCard = levelCardById.get(level.id);
  return {
    level,
    index,
    imageSrc: imageSourceById.get(level.imageId) ?? null,
    bestStars: Math.max(readBestStars(level.id), levelCard?.bestStars ?? 0),
    bestMoves: levelCard?.bestMoves ?? null,
  };
}

function levelOptionsForDifficulty(difficulty: DifficultyName): LevelOption[] {
  const catalogLevels = puzzleLevels.filter((level) => level.difficulty === difficulty);
  if (catalogLevels.length > 0) {
    return catalogLevels.map(toLevelOption);
  }

  return Array.from({ length: LEVELS_PER_DIFFICULTY }, (_, index) =>
    toLevelOption(generateLevelFixture(difficulty, index), index)
  );
}

export function LevelSelection({ difficulty, onBack, onStart }: LevelSelectionProps) {
  const trackLabel = titleCase(difficulty);
  const levelOptions = levelOptionsForDifficulty(difficulty);

  return (
    <main className="screen-band">
      <header className="screen-header">
        <IconButton icon={ArrowLeft} label="Back to difficulty" onClick={onBack} />
        <h1>{trackLabel} Levels</h1>
      </header>
      <section className="level-grid" aria-label={`${trackLabel} level cards`}>
        {levelOptions.map(({ level, index, imageSrc, bestStars, bestMoves }) => (
          <article className="level-card" key={level.id}>
            <div className="level-thumb" aria-hidden="true">
              {imageSrc ? <img src={imageSrc} alt="" /> : <span className="thumb-rings" />}
            </div>
            <div className="level-card__body">
              <h2>{level.title}</h2>
              <p>Playable puzzle</p>
              <div className="level-meta">
                {bestStars > 0 ? (
                  <span>
                    <Star aria-hidden="true" size={14} /> {bestStars}
                  </span>
                ) : (
                  <span>Not played</span>
                )}
                <span>{`Rings ${level.rings}`}</span>
                <span>{`Ticks ${level.ticks}`}</span>
                <span>{bestMoves === null ? "Best moves --" : `Best moves ${bestMoves}`}</span>
                <span>{level.showCouplingHints ? "Hints available" : "No coupling hints"}</span>
              </div>
            </div>
            <IconButton
              icon={Play}
              label={`Start ${level.title}`}
              onClick={() => onStart(level, index, level.imageId)}
              variant="primary"
            />
          </article>
        ))}
      </section>
    </main>
  );
}
