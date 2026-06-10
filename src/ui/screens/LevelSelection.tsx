import { ArrowLeft, Play, Star } from "lucide-react";

import { IconButton } from "../components/IconButton";
import {
  LEVELS_PER_DIFFICULTY,
  difficultyRings,
  difficultyTicks,
  generateLevelFixture,
  levelId,
  levelImageId,
  levelTitle,
} from "../levelAdapter";
import { defaultImagePresets } from "../fixtureData";
import type { DifficultyName, PuzzleLevelFixture } from "../types";

type LevelSelectionProps = {
  difficulty: DifficultyName;
  onBack: () => void;
  onStart: (level: PuzzleLevelFixture, index: number, imageId: string) => void;
};

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

export function LevelSelection({ difficulty, onBack, onStart }: LevelSelectionProps) {
  const trackLabel = titleCase(difficulty);
  const rings = difficultyRings(difficulty);
  const ticks = difficultyTicks(difficulty);
  const showHints = difficulty === "beginner" || difficulty === "easy";

  const levelStubs = Array.from({ length: LEVELS_PER_DIFFICULTY }, (_, i) => {
    const imgId = levelImageId(difficulty, i);
    return {
      id: levelId(difficulty, i),
      title: levelTitle(difficulty, i),
      index: i,
      imageId: imgId,
      imageSrc: defaultImagePresets.find((p) => p.id === imgId)?.src ?? null,
    };
  });

  return (
    <main className="screen-band">
      <header className="screen-header">
        <IconButton icon={ArrowLeft} label="Back to difficulty" onClick={onBack} />
        <h1>{trackLabel} Levels</h1>
      </header>
      <section className="level-grid" aria-label={`${trackLabel} level cards`}>
        {levelStubs.map(({ id, title, index, imageId, imageSrc }) => {
          const bestStars = readBestStars(id);
          return (
            <article className="level-card" key={id}>
              <div className="level-thumb" aria-hidden="true">
                {imageSrc ? (
                  <img src={imageSrc} alt="" className="thumb-image" />
                ) : (
                  <span className="thumb-rings" />
                )}
              </div>
              <div className="level-card__body">
                <h2>{title}</h2>
                <div className="level-meta">
                  {bestStars > 0 ? (
                    <span>
                      <Star aria-hidden="true" size={14} /> {bestStars}
                    </span>
                  ) : (
                    <span>Not played</span>
                  )}
                  <span>{`Rings ${rings}`}</span>
                  <span>{`Ticks ${ticks}`}</span>
                  <span>{showHints ? "Hints available" : "No coupling hints"}</span>
                </div>
              </div>
              <IconButton
                icon={Play}
                label={`Start ${title}`}
                onClick={() => onStart(generateLevelFixture(difficulty, index), index, imageId)}
                variant="primary"
              />
            </article>
          );
        })}
      </section>
    </main>
  );
}
