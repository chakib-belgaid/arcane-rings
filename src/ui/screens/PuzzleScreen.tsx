import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { CouplingMapDialog } from "../coupling-map/CouplingMapDialog";
import { IconButton } from "../components/IconButton";
import { ModalShell } from "../components/ModalShell";
import { PuzzleHud } from "../hud/PuzzleHud";
import { PuzzleLevelFixture } from "../types";
import { modNorm } from "../../interaction/pointerDrag";
import { PuzzleCanvas, type PuzzleCanvasCommit } from "../../render/PuzzleCanvas";
import type { WinResult } from "./WinScreen";

type PuzzleScreenProps = {
  level: PuzzleLevelFixture;
  imageSrc: string;
  imageTitle: string;
  inputBlocked: boolean;
  referenceDefault: boolean;
  colorblindCoupling: boolean;
  fixtureControlsEnabled: boolean;
  onMenu: () => void;
  onSettings: () => void;
  onFixtureComplete: (result: WinResult) => void;
};

type BestScore = {
  moveCount: number;
  tickCost: number;
  elapsedMs: number;
};

type MoveHistoryEntry = {
  offsets: number[];
  tickCost: number;
};

const hintMessages = [
  "Focus on the ring that shifts the most neighbors.",
  "Ring 3 still needs adjustment.",
  "Try ring 3 counterclockwise by 3 ticks.",
];

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

export function PuzzleScreen({
  level,
  imageSrc,
  imageTitle,
  inputBlocked,
  referenceDefault,
  colorblindCoupling,
  fixtureControlsEnabled,
  onMenu,
  onSettings,
  onFixtureComplete,
}: PuzzleScreenProps) {
  const [couplingOpen, setCouplingOpen] = useState(false);
  const [solutionOpen, setSolutionOpen] = useState(false);
  const [hintLayer, setHintLayer] = useState(0);
  const [referenceVisible, setReferenceVisible] = useState(level.showReferenceThumbnail && referenceDefault);
  const [offsets, setOffsets] = useState(() => Array.from({ length: level.rings }, () => 0));
  const [moveHistory, setMoveHistory] = useState<MoveHistoryEntry[]>([]);
  const [moveCount, setMoveCount] = useState(0);
  const [playerTickCost, setPlayerTickCost] = useState(0);
  const [hintCount, setHintCount] = useState(0);
  const [completedAtMs, setCompletedAtMs] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const startedAt = useMemo(() => Date.now(), []);
  const elapsedTime = formatDuration(completedAtMs ?? elapsedMs);
  const inputGated = couplingOpen || solutionOpen || inputBlocked || completedAtMs !== null;
  const hintExhausted = hintLayer >= hintMessages.length;
  const currentHint = hintLayer > 0 ? hintMessages[hintLayer - 1] : null;
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

  useEffect(() => {
    if (completedAtMs !== null) {
      return;
    }

    const updateElapsed = () => setElapsedMs(Date.now() - startedAt);
    updateElapsed();
    const intervalId = window.setInterval(updateElapsed, 1000);
    return () => window.clearInterval(intervalId);
  }, [completedAtMs, startedAt]);

  const handleCommit = ({ controlRing, deltaTicks }: PuzzleCanvasCommit) => {
    if (deltaTicks === 0) {
      return;
    }

    setMoveHistory((history) => [...history, { offsets: [...offsets], tickCost: Math.abs(deltaTicks) }]);
    setMoveCount((current) => current + 1);
    setPlayerTickCost((current) => current + Math.abs(deltaTicks));
    setOffsets((currentOffsets) =>
      currentOffsets.map((offset, ring) =>
        modNorm(offset + (matrix[ring]?.[controlRing] ?? 0) * deltaTicks, level.ticks)
      )
    );
  };

  const handleHint = () => {
    setHintLayer((layer) => {
      const nextLayer = Math.min(layer + 1, hintMessages.length);
      if (nextLayer !== layer) {
        setHintCount((count) => count + 1);
      }
      return nextLayer;
    });
  };

  const handleUndo = () => {
    const lastMove = moveHistory.at(-1);
    if (!lastMove) {
      return;
    }

    setOffsets([...lastMove.offsets]);
    setMoveCount((current) => Math.max(0, current - 1));
    setPlayerTickCost((current) => Math.max(0, current - lastMove.tickCost));
    setMoveHistory((history) => history.slice(0, -1));
  };

  const handleFixtureComplete = useCallback(() => {
    const finalElapsedMs = completedAtMs ?? Date.now() - startedAt;
    const currentScore = { moveCount, tickCost: playerTickCost, elapsedMs: finalElapsedMs };
    const { best, isPersonalBest } = chooseBestScore(currentScore, readBestScore(storageKey));

    if (isPersonalBest) {
      writeBestScore(storageKey, best);
    }

    setCompletedAtMs(finalElapsedMs);
    onFixtureComplete({
      title: `${imageTitle} Restored`,
      stars: moveCount <= level.moves ? 3 : moveCount <= level.moves * 1.5 ? 2 : 1,
      moveCount,
      playerTickCost,
      optimalTickCost: level.moves,
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
    level.moves,
    level.rings,
    level.ticks,
    moveCount,
    onFixtureComplete,
    playerTickCost,
    startedAt,
    storageKey,
  ]);

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
            offsets={offsets}
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
        {currentHint ? (
          <div className="hint-toast" role="status" aria-live="polite">
            {currentHint}
          </div>
        ) : null}
      </section>
      <PuzzleHud
        level={level}
        moveCount={moveCount}
        elapsedTime={elapsedTime}
        onUndo={handleUndo}
        undoDisabled={moveHistory.length === 0 || inputGated}
        onHint={handleHint}
        hintDisabled={hintExhausted || inputGated}
        onToggleReference={() => setReferenceVisible((visible) => !visible)}
        referenceVisible={referenceVisible}
        onCouplingMap={() => setCouplingOpen(true)}
        onSettings={onSettings}
        onFixtureComplete={handleFixtureComplete}
        fixtureControlsEnabled={fixtureControlsEnabled}
      />
      {couplingOpen ? (
        <CouplingMapDialog
          colorblindCoupling={colorblindCoupling}
          edges={level.edges}
          onClose={() => setCouplingOpen(false)}
        />
      ) : null}
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
