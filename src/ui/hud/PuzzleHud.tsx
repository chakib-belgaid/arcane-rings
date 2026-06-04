import { Eye, Lightbulb, Map, Settings, Undo2 } from "lucide-react";

import { IconButton } from "../components/IconButton";
import { PuzzleLevelFixture } from "../types";

type PuzzleHudProps = {
  level: PuzzleLevelFixture;
  moveCount: number;
  elapsedTime: string;
  canUndo: boolean;
  controlsDisabled: boolean;
  onUndo: () => void;
  onHint: () => void;
  hintDisabled: boolean;
  onToggleReference: () => void;
  referenceVisible: boolean;
  onCouplingMap: () => void;
  onSettings: () => void;
};

export function PuzzleHud({
  level,
  moveCount,
  elapsedTime,
  canUndo,
  controlsDisabled,
  onUndo,
  onHint,
  hintDisabled,
  onToggleReference,
  referenceVisible,
  onCouplingMap,
  onSettings,
}: PuzzleHudProps) {
  return (
    <aside className="hud hud--compact" data-testid="puzzle-hud" aria-label="Puzzle controls">
      <div className="hud-chip hud-chip--moves">
        <span>Moves</span>
        <strong>{moveCount}</strong>
      </div>
      <div className="hud-chip hud-chip--time">
        <span>Time</span>
        <strong>{elapsedTime}</strong>
      </div>
      <div className="hud-cluster">
        <IconButton
          icon={Undo2}
          label="Undo"
          aria-keyshortcuts="Z"
          onClick={onUndo}
          disabled={!canUndo || controlsDisabled}
        />
        <IconButton
          icon={Lightbulb}
          label="Hint"
          aria-keyshortcuts="H"
          onClick={onHint}
          disabled={hintDisabled || controlsDisabled}
        />
        <IconButton
          icon={Eye}
          label="Toggle reference thumbnail"
          onClick={onToggleReference}
          aria-pressed={referenceVisible}
          disabled={controlsDisabled}
        />
        {level.showCouplingHints ? (
          <IconButton icon={Map} label="Open coupling map" onClick={onCouplingMap} disabled={controlsDisabled} />
        ) : null}
        <IconButton icon={Settings} label="Open settings" onClick={onSettings} />
      </div>
      <div className="hud-chip">
        <span>{level.difficulty}</span>
        <strong>
          {level.rings}R/{level.ticks}T
        </strong>
      </div>
    </aside>
  );
}
