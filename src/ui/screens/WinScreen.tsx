import { ArrowRight, Home, RotateCcw, Star } from "lucide-react";

import { IconButton } from "../components/IconButton";

export type WinResult = {
  title: string;
  stars: 1 | 2 | 3;
  moveCount: number;
  playerTickCost: number;
  optimalTickCost: number;
  elapsedTime: string;
  elapsedMs: number;
  hintCount: number;
  difficultyScore: string;
  bestScore: string;
  bestMoveCount: number;
  bestTickCost: number;
  bestElapsedTime: string;
  isPersonalBest: boolean;
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
          <dl className="result-grid" aria-label="Completion report">
            <div data-testid="win-movements">
              <dt>Movements</dt>
              <dd>{result.moveCount}</dd>
            </div>
            <div data-testid="win-duration">
              <dt>Duration</dt>
              <dd>{result.elapsedTime}</dd>
            </div>
            <div data-testid="win-tick-cost">
              <dt>Tick cost</dt>
              <dd>{result.playerTickCost === 1 ? "1 tick" : `${result.playerTickCost} ticks`}</dd>
            </div>
            <div>
              <dt>Optimal ticks</dt>
              <dd>{result.optimalTickCost}</dd>
            </div>
            <div>
              <dt>Hints</dt>
              <dd>{result.hintCount}</dd>
            </div>
            <div>
              <dt>Difficulty</dt>
              <dd>{result.difficultyScore}</dd>
            </div>
            <div data-testid="win-best-score" className="result-grid__best">
              <dt>Best score</dt>
              <dd>
                <span>{result.bestScore}</span>
                {result.isPersonalBest ? <span className="result-badge">New best</span> : null}
              </dd>
            </div>
          </dl>
          <div className="win-actions">
            <IconButton icon={ArrowRight} label="Play again" text="Play again" variant="primary" onClick={onNext} />
            <IconButton icon={RotateCcw} label="Retry" text="Retry" onClick={onRetry} />
            <IconButton icon={Home} label="Main menu" text="Menu" onClick={onMenu} />
          </div>
        </div>
      </section>
    </div>
  );
}
