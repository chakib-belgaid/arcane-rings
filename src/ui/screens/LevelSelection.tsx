import { ArrowLeft, Lock, Play, Star } from "lucide-react";

import { IconButton } from "../components/IconButton";
import { levelCards } from "../fixtureData";
import { DifficultyName } from "../types";

type LevelSelectionProps = {
  difficulty: DifficultyName;
  onBack: () => void;
  onStart: (levelId: string) => void;
};

const titleCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export function LevelSelection({ difficulty, onBack, onStart }: LevelSelectionProps) {
  const cards = levelCards.filter((card) => card.difficulty === difficulty);
  const trackLabel = titleCase(difficulty);

  return (
    <main className="screen-band">
      <header className="screen-header">
        <IconButton icon={ArrowLeft} label="Back to difficulty" onClick={onBack} />
        <h1>{trackLabel} Levels</h1>
      </header>
      {cards.length === 0 ? (
        <section className="empty-state" aria-label={`${trackLabel} level cards`}>
          <h2>No unlocked {trackLabel} levels yet.</h2>
          <p>Choose another track.</p>
          <IconButton icon={ArrowLeft} label="Choose another track" text="Back" onClick={onBack} />
        </section>
      ) : (
        <section className="level-grid" aria-label={`${trackLabel} level cards`}>
          {cards.map((level) => (
            <article className={`level-card ${level.locked ? "level-card--locked" : ""}`} key={level.id}>
              <div className="level-thumb" aria-hidden="true">
                {level.locked ? (
                  <Lock size={28} />
                ) : level.imageSrc ? (
                  <img src={level.imageSrc} alt="" />
                ) : (
                  <span className="thumb-rings" />
                )}
              </div>
              <div className="level-card__body">
                <h2>{level.title}</h2>
                <p>{level.locked ? "Locked preview" : "Playable puzzle"}</p>
                <div className="level-meta">
                  <span>
                    <Star aria-hidden="true" size={14} /> {level.bestStars}
                  </span>
                  <span>{`Rings ${level.rings}`}</span>
                  <span>{`Ticks ${level.ticks}`}</span>
                  <span>{level.bestMoves === null ? "Best moves --" : `Best moves ${level.bestMoves}`}</span>
                  <span>{level.hintsAvailable ? "Hints available" : "No coupling hints"}</span>
                </div>
              </div>
              <IconButton
                icon={Play}
                label={level.locked ? `${level.title} locked` : `Start ${level.title}`}
                onClick={() => onStart(level.id)}
                disabled={level.locked}
                variant={level.locked ? "ghost" : "primary"}
              />
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
