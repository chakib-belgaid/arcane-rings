import { ArrowLeft, ChevronRight, Star } from "lucide-react";

import { IconButton } from "../components/IconButton";
import { difficultyTracks } from "../fixtureData";
import { DifficultyName } from "../types";

type DifficultySelectionProps = {
  onBack: () => void;
  onOpenLevels: (difficulty: DifficultyName) => void;
};

export function DifficultySelection({ onBack, onOpenLevels }: DifficultySelectionProps) {
  return (
    <main className="screen-band">
      <header className="screen-header">
        <IconButton icon={ArrowLeft} label="Back to menu" onClick={onBack} />
        <h1>Difficulty</h1>
      </header>
      <section className="track-list" aria-label="Difficulty tracks">
        {difficultyTracks.map((track) => (
          <article className="track-row" key={track.id}>
            <div>
              <h2>{track.label}</h2>
              <p>{track.coupling}</p>
            </div>
            <dl className="track-stats">
              <div>
                <dt>Rings</dt>
                <dd>{track.rings}</dd>
              </div>
              <div>
                <dt>Ticks</dt>
                <dd>{track.ticks}</dd>
              </div>
              <div>
                <dt>Completed</dt>
                <dd>{track.completed}</dd>
              </div>
              <div>
                <dt>Stars</dt>
                <dd>
                  <Star aria-hidden="true" size={14} />
                  {track.bestStars}
                </dd>
              </div>
            </dl>
            <IconButton
              icon={ChevronRight}
              label={`Open ${track.label} levels`}
              onClick={() => onOpenLevels(track.id)}
            />
          </article>
        ))}
      </section>
    </main>
  );
}
