import { HelpCircle, Image, Map, RotateCcw, Settings, Undo2 } from "lucide-react";
import { useMemo, useState } from "react";
import { APP_CONFIG } from "../config/appConfig";
import { createPlaceholderRuntimeState, seedPlaceholderLevel } from "../state/placeholderGameState";
import { PlaceholderPuzzleCanvas } from "./components/PlaceholderPuzzleCanvas";

const hudActions = [
  { label: "Undo", icon: Undo2 },
  { label: "Hint", icon: HelpCircle },
  { label: "Reference", icon: Image },
  { label: "Coupling map", icon: Map },
  { label: "Settings", icon: Settings },
];

export function ProjectCirclesApp() {
  const level = useMemo(() => seedPlaceholderLevel(APP_CONFIG.placeholderSeed), []);
  const [runtimeState] = useState(() => createPlaceholderRuntimeState(level));

  return (
    <main className="app-shell" aria-labelledby="app-title">
      <section className="play-surface" aria-label="Seeded Project Circles placeholder">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true" />
          <div>
            <h1 id="app-title">Project Circles</h1>
            <p>Seed {level.seed}</p>
          </div>
        </div>

        <div className="top-hud" aria-label="Puzzle status">
          <div className="hud-chip">
            <span>Track</span>
            <strong>{level.difficultyName}</strong>
          </div>
        </div>

        <PlaceholderPuzzleCanvas level={level} runtimeState={runtimeState} />

        <div className="control-rail" aria-label="Puzzle controls">
          {hudActions.map(({ label, icon: Icon }) => (
            <button className="icon-button" type="button" aria-label={label} title={label} key={label}>
              <Icon aria-hidden="true" size={20} strokeWidth={1.9} />
            </button>
          ))}
        </div>

        <aside className="integration-panel" aria-label="Integration notes">
          <div>
            <span>Seeded level</span>
            <strong>
              {level.n} rings / {level.q} ticks
            </strong>
          </div>
          <button className="restart-button" type="button">
            <RotateCcw aria-hidden="true" size={16} />
            Restart
          </button>
        </aside>
      </section>
    </main>
  );
}
