import { Eye, Lightbulb, Map, Settings, Trophy, Undo2 } from "lucide-react";

import { IconButton } from "../components/IconButton";
import { PuzzleLevelFixture } from "../types";

type PuzzleHudProps = {
  level: PuzzleLevelFixture;
  onUndo: () => void;
  onHint: () => void;
  onToggleReference: () => void;
  onCouplingMap: () => void;
  onSettings: () => void;
  onFixtureComplete: () => void;
};

export function PuzzleHud({
  level,
  onUndo,
  onHint,
  onToggleReference,
  onCouplingMap,
  onSettings,
  onFixtureComplete,
}: PuzzleHudProps) {
  return (
    <aside className="hud hud--compact" data-testid="puzzle-hud" aria-label="Puzzle controls">
      <div className="hud-chip hud-chip--moves">
        <span>Moves</span>
        <strong>{level.moves}</strong>
      </div>
      <div className="hud-cluster">
        <IconButton icon={Undo2} label="Undo" onClick={onUndo} />
        <IconButton icon={Lightbulb} label="Hint" onClick={onHint} />
        <IconButton icon={Eye} label="Toggle reference thumbnail" onClick={onToggleReference} />
        {level.showCouplingHints ? <IconButton icon={Map} label="Open coupling map" onClick={onCouplingMap} /> : null}
        <IconButton icon={Settings} label="Open settings" onClick={onSettings} />
        <IconButton icon={Trophy} label="Complete fixture level" onClick={onFixtureComplete} />
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
