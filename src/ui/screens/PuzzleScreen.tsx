import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { CouplingMapDialog } from "../coupling-map/CouplingMapDialog";
import { IconButton } from "../components/IconButton";
import { ModalShell } from "../components/ModalShell";
import { PuzzleHud } from "../hud/PuzzleHud";
import { PuzzleLevelFixture } from "../types";
import { PuzzleCanvas, type PuzzleCanvasCommit } from "../../render/PuzzleCanvas";
import { applyPlayerMove, computeStars, createRuntimeState, selectHint, undoLastMove } from "../../state/gameState";
import type { Hint } from "../../state/types";
import { cyclicDistance, modNorm } from "../../math/mod";
import type { WinResult } from "./WinScreen";

type PuzzleScreenProps = {
  level: PuzzleLevelFixture;
  imageSrc: string;
  imageTitle: string;
  inputBlocked: boolean;
  onMenu: () => void;
  onSettings: () => void;
  onComplete: (result: WinResult) => void;
};

type BestScore = {
  moveCount: number;
  tickCost: number;
  elapsedMs: number;
};

function formatDuration(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function bestScoreKey(levelId: string, imageTitle: string): string {
  return `project-circles:best-score:${levelId}:${imageTitle}`;
}

function readBestScore(key: string): BestScore | null {
  try {
    const stored = window.localStorage.getItem(key);
    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored) as Partial<BestScore>;
    if (typeof parsed.moveCount !== "number" || typeof parsed.elapsedMs !== "number") {
      return null;
    }

    return {
      moveCount: parsed.moveCount,
      tickCost: typeof parsed.tickCost === "number" ? parsed.tickCost : parsed.moveCount,
      elapsedMs: parsed.elapsedMs,
    };
  } catch {
    return null;
  }
}

function writeBestScore(key: string, score: BestScore): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(score));
  } catch {
    // Storage is optional; the report still shows the current session score.
  }
}

function chooseBestScore(current: BestScore, previous: BestScore | null): { best: BestScore; isPersonalBest: boolean } {
  if (!previous) {
    return { best: current, isPersonalBest: true };
  }

  const isBetter =
    current.moveCount < previous.moveCount ||
    (current.moveCount === previous.moveCount && current.tickCost < previous.tickCost) ||
    (current.moveCount === previous.moveCount &&
      current.tickCost === previous.tickCost &&
      current.elapsedMs < previous.elapsedMs);

  return isBetter ? { best: current, isPersonalBest: true } : { best: previous, isPersonalBest: false };
}

function formatCount(value: number, singular: string): string {
  return `${value} ${singular}${value === 1 ? "" : "s"}`;
}

function formatBestScore(score: BestScore): string {
  return `${formatCount(score.moveCount, "move")} · ${formatCount(score.tickCost, "tick")} · ${formatDuration(score.elapsedMs)}`;
}

function normalizedVector(values: number[], length: number, q: number): number[] {
  return Array.from({ length }, (_, index) => modNorm(values[index] ?? 0, q));
}

function solutionTickCost(solution: number[], q: number): number {
  return solution.reduce((total, ticks) => total + cyclicDistance(ticks, q), 0);
}

function formatHintText(hint: Hint, hintLayer: number): string {
  if (!hint) {
    return "All rings are aligned";
  }

  const ringLabel = `Ring ${hint.ring + 1}`;
  if (hintLayer === 1) {
    return `Focus ${ringLabel}`;
  }
  if (hintLayer === 2) {
    return `${ringLabel} still needs adjustment`;
  }

  const direction = hint.signedTicks < 0 ? "counterclockwise" : "clockwise";
  const ticks = Math.abs(hint.signedTicks);
  return `${ringLabel} ${direction} ${ticks} ${ticks === 1 ? "tick" : "ticks"}`;
}

export function PuzzleScreen({
  level,
  imageSrc,
  imageTitle,
  inputBlocked,
  onMenu,
  onSettings,
  onComplete,
}: PuzzleScreenProps) {
  const [couplingOpen, setCouplingOpen] = useState(false);
  const [solutionOpen, setSolutionOpen] = useState(false);
  const [hintLayer, setHintLayer] = useState(0);
  const [referenceVisible, setReferenceVisible] = useState(level.showReferenceThumbnail);
  const [hintCount, setHintCount] = useState(0);
  const [completedAtMs, setCompletedAtMs] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const startedAt = useMemo(() => Date.now(), []);
  const initialOffsets = useMemo(
    () => normalizedVector(level.initialOffsets, level.rings, level.ticks),
    [level.initialOffsets, level.rings, level.ticks],
  );
  const solution = useMemo(
    () => normalizedVector(level.solution, level.rings, level.ticks),
    [level.rings, level.solution, level.ticks],
  );
  const [runtimeState, setRuntimeState] = useState(() => createRuntimeState(initialOffsets, startedAt));
  const elapsedTime = formatDuration(completedAtMs ?? elapsedMs);
  const matrix = useMemo(() => {
    const generated: number[][] = Array.from({ length: level.rings }, (_, row) =>
      Array.from({ length: level.rings }, (_, column) => (row === column ? 1 : 0))
    );

    for (const edge of level.edges) {
      const visualRing = edge.visualRing - 1;
      const controlRing = edge.controlRing - 1;
      if (generated[visualRing]?.[controlRing] !== undefined) {
        generated[visualRing][controlRing] = edge.factor;
      }
    }

    return generated;
  }, [level.edges, level.rings]);
  const storageKey = useMemo(() => bestScoreKey(level.id, imageTitle), [imageTitle, level.id]);
  const optimalTickCost = useMemo(
    () => level.moves || solutionTickCost(level.solution, level.ticks),
    [level.moves, level.solution, level.ticks],
  );
  const hint = useMemo(
    () => selectHint(solution, runtimeState.accumulatedMoves, level.ticks),
    [level.ticks, runtimeState.accumulatedMoves, solution],
  );
  const moveCount = runtimeState.moveHistory.length;
  const playerTickCost = runtimeState.totalTickMoves;
  const inputGated = couplingOpen || solutionOpen || inputBlocked || completedAtMs !== null || runtimeState.isSolved;

  useEffect(() => {
    if (completedAtMs !== null) {
      return;
    }

    const updateElapsed = () => setElapsedMs(Date.now() - startedAt);
    updateElapsed();
    const intervalId = window.setInterval(updateElapsed, 1000);
    return () => window.clearInterval(intervalId);
  }, [completedAtMs, startedAt]);

  const handleCommit = useCallback(({ controlRing, deltaTicks }: PuzzleCanvasCommit) => {
    if (inputGated) {
      return;
    }
    if (deltaTicks === 0) {
      return;
    }

    setRuntimeState((current) => applyPlayerMove(current, matrix, controlRing, deltaTicks, level.ticks, Date.now()));
  }, [inputGated, level.ticks, matrix]);

  const handleUndo = useCallback(() => {
    if (inputGated) {
      return;
    }

    setRuntimeState((current) => undoLastMove(current, matrix, level.ticks));
  }, [inputGated, level.ticks, matrix]);

  const handleHint = useCallback(() => {
    if (inputGated || !hint) {
      return;
    }

    setHintLayer((layer) => {
      const nextLayer = Math.min(layer + 1, 3);
      if (nextLayer !== layer) {
        setHintCount((count) => count + 1);
      }
      return nextLayer;
    });
  }, [hint, inputGated]);

  const handleComplete = useCallback(() => {
    if (completedAtMs !== null) {
      return;
    }

    const finalElapsedMs = runtimeState.solvedAt === null ? Date.now() - startedAt : runtimeState.solvedAt - startedAt;
    const currentScore = { moveCount, tickCost: playerTickCost, elapsedMs: finalElapsedMs };
    const { best, isPersonalBest } = chooseBestScore(currentScore, readBestScore(storageKey));

    if (isPersonalBest) {
      writeBestScore(storageKey, best);
    }

    setCompletedAtMs(finalElapsedMs);
    onComplete({
      title: `${imageTitle} Restored`,
      stars: computeStars(optimalTickCost, playerTickCost),
      moveCount,
      playerTickCost,
      optimalTickCost,
      elapsedTime: formatDuration(finalElapsedMs),
      elapsedMs: finalElapsedMs,
      hintCount,
      difficultyScore: `${level.difficulty[0].toUpperCase()}${level.difficulty.slice(1)} · ${level.rings}R · ${level.ticks}T`,
      bestScore: formatBestScore(best),
      bestMoveCount: best.moveCount,
      bestTickCost: best.tickCost,
      bestElapsedTime: formatDuration(best.elapsedMs),
      isPersonalBest,
    });
  }, [
    completedAtMs,
    hintCount,
    imageTitle,
    level.difficulty,
    level.rings,
    level.ticks,
    moveCount,
    onComplete,
    optimalTickCost,
    playerTickCost,
    runtimeState.solvedAt,
    startedAt,
    storageKey,
  ]);

  useEffect(() => {
    if (runtimeState.isSolved && completedAtMs === null) {
      handleComplete();
    }
  }, [completedAtMs, handleComplete, runtimeState.isSolved]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      const key = event.key.toLowerCase();
      if (key === "z") {
        event.preventDefault();
        handleUndo();
      }
      if (key === "h") {
        event.preventDefault();
        handleHint();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleHint, handleUndo]);

  const hintText = hintLayer > 0 ? formatHintText(hint, hintLayer) : null;

  return (
    <main
      className="puzzle-screen"
      data-testid="puzzle-stage"
      data-input-gated={String(inputGated)}
      data-image-title={imageTitle}
    >
      <IconButton icon={ArrowLeft} label="Return to main menu" onClick={onMenu} className="puzzle-back" />
      <section className="puzzle-visual-wrap" aria-label={`${level.title}: ${imageTitle}`}>
        <div className="puzzle-visual" data-testid="puzzle-visual">
          <PuzzleCanvas
            imageSrc={imageSrc}
            offsets={runtimeState.currentOffsets}
            matrix={matrix}
            q={level.ticks}
            inputDisabled={inputGated}
            onCommit={handleCommit}
          />
        </div>
        {referenceVisible ? (
          <button
            className="reference-thumb"
            type="button"
            aria-label="Open solution reference fullscreen"
            aria-haspopup="dialog"
            data-testid="solution-reference-thumb"
            onClick={() => setSolutionOpen(true)}
          >
            <img src={imageSrc} alt="" />
          </button>
        ) : null}
        {hintText ? <div className="hint-toast" data-testid="hint-panel">{hintText}</div> : null}
      </section>
      <PuzzleHud
        level={level}
        moveCount={moveCount}
        elapsedTime={elapsedTime}
        canUndo={runtimeState.moveHistory.length > 0}
        controlsDisabled={inputGated}
        onUndo={handleUndo}
        onHint={handleHint}
        onToggleReference={() => setReferenceVisible((visible) => !visible)}
        onCouplingMap={() => setCouplingOpen(true)}
        onSettings={onSettings}
      />
      {couplingOpen ? <CouplingMapDialog edges={level.edges} onClose={() => setCouplingOpen(false)} /> : null}
      {solutionOpen ? (
        <ModalShell
          title="Solution Reference"
          closeLabel="Close solution reference"
          onClose={() => setSolutionOpen(false)}
          className="solution-modal"
        >
          <div className="solution-modal__image-wrap">
            <img src={imageSrc} alt={`${imageTitle} solution reference`} />
          </div>
        </ModalShell>
      ) : null}
    </main>
  );
}
