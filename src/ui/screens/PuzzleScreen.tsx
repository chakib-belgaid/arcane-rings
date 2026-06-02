import { ArrowLeft } from "lucide-react";
import { useMemo, useState } from "react";

import { CouplingMapDialog } from "../coupling-map/CouplingMapDialog";
import { IconButton } from "../components/IconButton";
import { PuzzleHud } from "../hud/PuzzleHud";
import { PuzzleLevelFixture } from "../types";
import { sampleImageDataUrl } from "../../fixtures/sampleImage";
import { modNorm } from "../../interaction/pointerDrag";
import { PuzzleCanvas, type PuzzleCanvasCommit } from "../../render/PuzzleCanvas";

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
  const [offsets, setOffsets] = useState(() => Array.from({ length: level.rings }, () => 0));
  const inputGated = couplingOpen || inputBlocked;
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

  const handleCommit = ({ controlRing, deltaTicks }: PuzzleCanvasCommit) => {
    setOffsets((currentOffsets) =>
      currentOffsets.map((offset, ring) =>
        modNorm(offset + (matrix[ring]?.[controlRing] ?? 0) * deltaTicks, level.ticks)
      )
    );
  };

  return (
    <main className="puzzle-screen" data-testid="puzzle-stage" data-input-gated={String(inputGated)}>
      <IconButton icon={ArrowLeft} label="Return to main menu" onClick={onMenu} className="puzzle-back" />
      <section className="puzzle-visual-wrap" aria-label={level.title}>
        <div className="puzzle-visual" data-testid="puzzle-visual">
          <PuzzleCanvas
            imageSrc={sampleImageDataUrl()}
            offsets={offsets}
            matrix={matrix}
            q={level.ticks}
            inputDisabled={inputGated}
            onCommit={handleCommit}
          />
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
