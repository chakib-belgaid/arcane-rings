import { Eye, Lightbulb, Map, Settings, Trophy, Undo2 } from "lucide-react";

import { IconButton } from "../components/IconButton";
import { PuzzleLevelFixture } from "../types";

type PuzzleHudProps = {
  level: PuzzleLevelFixture;
  elapsedTime: string;
  onUndo: () => void;
  undoDisabled: boolean;
  onHint: () => void;
  hintDisabled: boolean;
  onToggleReference: () => void;
  referenceVisible: boolean;
  onCouplingMap: () => void;
  onSettings: () => void;
  onFixtureComplete: () => void;
  fixtureControlsEnabled: boolean;
};

export function PuzzleHud({
  level,
  elapsedTime,
  onUndo,
  undoDisabled,
  onHint,
  hintDisabled,
  onToggleReference,
  referenceVisible,
  onCouplingMap,
  onSettings,
  onFixtureComplete,
  fixtureControlsEnabled,
}: PuzzleHudProps) {
  return (
    <aside className="hud hud--compact" data-testid="puzzle-hud" aria-label="Puzzle controls">
      <div className="hud-chip hud-chip--time">
        <span>Time</span>
        <strong>{elapsedTime}</strong>
      </div>
      <div className="hud-cluster">
        <IconButton icon={Undo2} label="Undo" onClick={onUndo} disabled={undoDisabled} />
        <IconButton icon={Lightbulb} label="Hint" onClick={onHint} disabled={hintDisabled} />
        <IconButton
          icon={Eye}
          label="Toggle reference thumbnail"
          onClick={onToggleReference}
          aria-pressed={referenceVisible}
        />
        {level.showCouplingHints ? <IconButton icon={Map} label="Open coupling map" onClick={onCouplingMap} /> : null}
        <IconButton icon={Settings} label="Open settings" onClick={onSettings} />
        {fixtureControlsEnabled ? (
          <IconButton icon={Trophy} label="Complete fixture level" onClick={onFixtureComplete} />
        ) : null}
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
