import { ArrowLeft, Lock, Play, Star } from "lucide-react";

import { IconButton } from "../components/IconButton";
import { levelCards } from "../fixtureData";
import { DifficultyName } from "../types";

type LevelSelectionProps = {
  difficulty: DifficultyName;
  onBack: () => void;
  onStart: () => void;
};

const titleCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export function LevelSelection({ difficulty, onBack, onStart }: LevelSelectionProps) {
  const cards = levelCards.filter((card) => card.difficulty === difficulty);

  return (
    <main className="screen-band">
      <header className="screen-header">
        <IconButton icon={ArrowLeft} label="Back to difficulty" onClick={onBack} />
        <h1>{titleCase(difficulty)} Levels</h1>
      </header>
      <section className="level-grid" aria-label={`${titleCase(difficulty)} level cards`}>
        {cards.map((level) => (
          <article className={`level-card ${level.locked ? "level-card--locked" : ""}`} key={level.id}>
            <div className="level-thumb" aria-hidden="true">
              {level.locked ? <Lock size={28} /> : <span className="thumb-rings" />}
            </div>
            <div className="level-card__body">
              <h2>{level.title}</h2>
              <p>{level.title === "Moon Gate Archive" ? "Playable shell" : "Locked preview"}</p>
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
              onClick={onStart}
              disabled={level.locked}
              variant={level.locked ? "ghost" : "primary"}
            />
          </article>
        ))}
      </section>
    </main>
  );
}
