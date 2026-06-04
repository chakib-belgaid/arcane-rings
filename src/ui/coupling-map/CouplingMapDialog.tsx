import { Minus, Plus } from "lucide-react";

import { ModalShell } from "../components/ModalShell";
import { CouplingEdge } from "../types";

type CouplingMapDialogProps = {
  edges: CouplingEdge[];
  colorblindCoupling: boolean;
  onClose: () => void;
};

function couplingDirectionLabel(edge: CouplingEdge, colorblindCoupling: boolean): string {
  if (colorblindCoupling) {
    return edge.factor > 0 ? "positive" : "negative";
  }

  return edge.factor > 0 ? "same" : "opposite";
}

export function CouplingMapDialog({ edges, colorblindCoupling, onClose }: CouplingMapDialogProps) {
  return (
    <ModalShell title="Coupling Map" closeLabel="Close coupling map" onClose={onClose} className="drawer-shell">
      <div className="coupling-list" aria-label="Coupling edges">
        {edges.map((edge) => (
          <div className="coupling-edge" key={`${edge.controlRing}-${edge.visualRing}-${edge.factor}`}>
            <span>{`Ring ${edge.controlRing} -> Ring ${edge.visualRing} x${edge.factor}`}</span>
            <strong>
              {edge.factor > 0 ? <Plus aria-hidden="true" size={14} /> : <Minus aria-hidden="true" size={14} />}
              {couplingDirectionLabel(edge, colorblindCoupling)}
            </strong>
          </div>
        ))}
      </div>
    </ModalShell>
  );
}
