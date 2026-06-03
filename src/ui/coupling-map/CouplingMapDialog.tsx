import { Minus, Plus } from "lucide-react";

import { ModalShell } from "../components/ModalShell";
import { CouplingEdge } from "../types";

type CouplingMapDialogProps = {
  edges: CouplingEdge[];
  onClose: () => void;
};

export function CouplingMapDialog({ edges, onClose }: CouplingMapDialogProps) {
  return (
    <ModalShell title="Coupling Map" closeLabel="Close coupling map" onClose={onClose} className="drawer-shell">
      <div className="coupling-list" aria-label="Coupling edges">
        {edges.map((edge) => (
          <div className="coupling-edge" key={`${edge.controlRing}-${edge.visualRing}-${edge.factor}`}>
            <span>{`Ring ${edge.controlRing} -> Ring ${edge.visualRing} x${edge.factor}`}</span>
            <strong>
              {edge.factor > 0 ? <Plus aria-hidden="true" size={14} /> : <Minus aria-hidden="true" size={14} />}
              {edge.factor > 0 ? "same" : "opposite"}
            </strong>
          </div>
        ))}
      </div>
    </ModalShell>
  );
}
