import { ArrowLeft } from "lucide-react";
import { useState } from "react";

import { CouplingMapDialog } from "../coupling-map/CouplingMapDialog";
import { IconButton } from "../components/IconButton";
import { PuzzleHud } from "../hud/PuzzleHud";
import { PuzzleLevelFixture } from "../types";

type PuzzleScreenProps = {
  level: PuzzleLevelFixture;
  inputBlocked: boolean;
  onMenu: () => void;
  onSettings: () => void;
  onFixtureComplete: () => void;
};

export function PuzzleScreen({ level, inputBlocked, onMenu, onSettings, onFixtureComplete }: PuzzleScreenProps) {
  const [couplingOpen, setCouplingOpen] = useState(false);
  const [hintLayer, setHintLayer] = useState(0);
  const [referenceVisible, setReferenceVisible] = useState(level.showReferenceThumbnail);
  const inputGated = couplingOpen || inputBlocked;

  return (
    <main className="puzzle-screen" data-testid="puzzle-stage" data-input-gated={String(inputGated)}>
      <IconButton icon={ArrowLeft} label="Return to main menu" onClick={onMenu} className="puzzle-back" />
      <section className="puzzle-visual-wrap" aria-label={level.title}>
        <div className="puzzle-visual" data-testid="puzzle-visual">
          <span className="puzzle-ring puzzle-ring--outer" />
          <span className="puzzle-ring puzzle-ring--middle" />
          <span className="puzzle-ring puzzle-ring--inner" />
          <span className="puzzle-ring puzzle-ring--core" />
        </div>
        {referenceVisible ? (
          <button className="reference-thumb" type="button" aria-label="Reference thumbnail">
            <span className="thumb-rings" aria-hidden="true" />
          </button>
        ) : null}
        {hintLayer > 0 ? <div className="hint-toast">Ring 3 still needs adjustment</div> : null}
      </section>
      <PuzzleHud
        level={level}
        onUndo={() => undefined}
        onHint={() => setHintLayer((layer) => Math.min(layer + 1, 3))}
        onToggleReference={() => setReferenceVisible((visible) => !visible)}
        onCouplingMap={() => setCouplingOpen(true)}
        onSettings={onSettings}
        onFixtureComplete={onFixtureComplete}
      />
      {couplingOpen ? <CouplingMapDialog edges={level.edges} onClose={() => setCouplingOpen(false)} /> : null}
    </main>
  );
}
