import { ArrowRight, Home, RotateCcw, Star } from "lucide-react";

import { IconButton } from "../components/IconButton";

export type WinResult = {
  title: string;
  stars: 1 | 2 | 3;
  playerTickCost: number;
  optimalTickCost: number;
  elapsedTime: string;
  hintCount: number;
  difficultyScore: string;
};

type WinScreenProps = {
  result: WinResult;
  onNext: () => void;
  onRetry: () => void;
  onMenu: () => void;
};

export function WinScreen({ result, onNext, onRetry, onMenu }: WinScreenProps) {
  return (
    <div className="modal-backdrop modal-backdrop--victory">
      <section className="win-screen" role="dialog" aria-modal="true" aria-label={result.title}>
        <div className="win-art" aria-hidden="true">
          <span className="thumb-rings thumb-rings--large" />
        </div>
        <div className="win-copy">
          <h2>{result.title}</h2>
          <div className="stars" aria-label={`${result.stars} stars`}>
            {Array.from({ length: result.stars }).map((_, index) => (
              <Star key={index} aria-hidden="true" size={20} fill="currentColor" />
            ))}
          </div>
          <div className="result-grid">
            <span>Player ticks {result.playerTickCost}</span>
            <span>Optimal ticks {result.optimalTickCost}</span>
            <span>Elapsed {result.elapsedTime}</span>
            <span>Hints {result.hintCount}</span>
            <span>{result.difficultyScore}</span>
          </div>
          <div className="win-actions">
            <IconButton icon={ArrowRight} label="Next level" text="Next level" variant="primary" onClick={onNext} />
            <IconButton icon={RotateCcw} label="Retry" text="Retry" onClick={onRetry} />
            <IconButton icon={Home} label="Main menu" text="Menu" onClick={onMenu} />
          </div>
        </div>
      </section>
    </div>
  );
}
