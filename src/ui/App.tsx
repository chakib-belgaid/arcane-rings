import { useEffect, useReducer, useState } from "react";
import { assets } from "../assets";
import { demoLevel } from "../levels/demoLevel";
import { getStars, reducer as gameReducer } from "../game/gameState";
import type { GameAction, RuntimeState } from "../game/types";
import { createRuntimeState } from "../game/gameState";
import {
  createDefaultSaveData,
  loadSaveData,
  persistSaveData,
  type SaveData,
  type UserSettings
} from "../persistence/saveData";
import { PuzzleCanvas } from "../render/PuzzleCanvas";
import {
  BookIcon,
  CalendarIcon,
  ChevronIcon,
  CloseIcon,
  CollectionIcon,
  HintIcon,
  ImageIcon,
  MapIcon,
  RestartIcon,
  SettingsIcon,
  UndoIcon
} from "./icons";

type Screen = "menu" | "play";
type Overlay = "settings" | "coupling" | "win" | "levels" | "daily" | "collection" | null;

export default function App() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [saveData, setSaveData] = useState<SaveData>(() => {
    if (typeof window === "undefined") {
      return createDefaultSaveData();
    }
    return loadSaveData();
  });
  const [runtime, dispatchRuntime] = useReducer(
    (state: RuntimeState, action: GameAction) => gameReducer(state, demoLevel, action),
    createRuntimeState(demoLevel)
  );
  const [showReference, setShowReference] = useState(saveData.settings.showReferenceDefault);

  const dispatch = (action: GameAction) => {
    dispatchRuntime(action);
  };

  useEffect(() => {
    persistSaveData(saveData);
  }, [saveData]);

  useEffect(() => {
    if (runtime.isSolved && runtime.solvedAt === null) {
      dispatch({ type: "completeIfSolved", now: Date.now() });
      setOverlay("win");
    }
  }, [runtime.isSolved, runtime.solvedAt]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (screen !== "play") {
        return;
      }

      if (event.key === "Escape") {
        setOverlay((current) => (current === null ? "settings" : null));
        return;
      }

      if (overlay !== null) {
        return;
      }

      if (event.key.toLowerCase() === "z") {
        dispatch({ type: "undo" });
      }
      if (event.key.toLowerCase() === "h") {
        dispatch({ type: "requestHint" });
      }
      if (runtime.selectedRing !== null && event.key === "ArrowRight") {
        dispatch({ type: "commitRotation", controlRing: runtime.selectedRing, deltaTicks: 1 });
        dispatch({ type: "selectRing", ring: runtime.selectedRing });
      }
      if (runtime.selectedRing !== null && event.key === "ArrowLeft") {
        dispatch({ type: "commitRotation", controlRing: runtime.selectedRing, deltaTicks: -1 });
        dispatch({ type: "selectRing", ring: runtime.selectedRing });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [overlay, runtime.selectedRing, screen]);

  const stars = getStars(demoLevel, runtime);
  const elapsedMs = (runtime.solvedAt ?? Date.now()) - runtime.startedAt;

  function startLevel() {
    dispatch({ type: "restart", now: Date.now() });
    setScreen("play");
    setOverlay(null);
    setShowReference(saveData.settings.showReferenceDefault);
  }

  function updateSettings(nextSettings: UserSettings) {
    setSaveData((current) => ({ ...current, settings: nextSettings }));
  }

  function recordWin() {
    setSaveData((current) => {
      const previous = current.levelProgress[demoLevel.id];
      const bestStars = Math.max(previous?.bestStars ?? 0, stars) as 0 | 1 | 2 | 3;
      const elapsedTime = runtime.solvedAt === null ? null : runtime.solvedAt - runtime.startedAt;
      return {
        ...current,
        levelProgress: {
          ...current.levelProgress,
          [demoLevel.id]: {
            levelId: demoLevel.id,
            solved: true,
            bestStars,
            bestMoveCount:
              previous?.bestMoveCount === null || previous?.bestMoveCount === undefined
                ? runtime.totalTickMoves
                : Math.min(previous.bestMoveCount, runtime.totalTickMoves),
            bestTimeMs:
              previous?.bestTimeMs === null || previous?.bestTimeMs === undefined || elapsedTime === null
                ? elapsedTime
                : Math.min(previous.bestTimeMs, elapsedTime),
            completedAt: new Date().toISOString()
          }
        },
        unlockedImageIds: Array.from(new Set([...current.unlockedImageIds, demoLevel.imageId]))
      };
    });
  }

  useEffect(() => {
    if (overlay === "win") {
      recordWin();
    }
  }, [overlay]);

  return (
    <div className={["app", saveData.settings.reducedMotion ? "is-reduced-motion" : "", saveData.settings.highContrastBorders ? "is-high-contrast" : ""].join(" ")}>
      {screen === "menu" ? (
        <MainMenu onPlay={startLevel} onOpenOverlay={setOverlay} saveData={saveData} />
      ) : (
        <PuzzleScreen
          runtime={runtime}
          overlay={overlay}
          showReference={showReference}
          settings={saveData.settings}
          onDispatch={dispatch}
          onMenu={() => {
            setScreen("menu");
            setOverlay(null);
          }}
          onOpenOverlay={setOverlay}
          onToggleReference={() => setShowReference((current) => !current)}
        />
      )}

      {overlay === "settings" && (
        <SettingsDialog
          settings={saveData.settings}
          onClose={() => setOverlay(null)}
          onChange={updateSettings}
          onResetProgress={() => setSaveData(createDefaultSaveData())}
        />
      )}
      {overlay === "coupling" && <CouplingDrawer onClose={() => setOverlay(null)} />}
      {overlay === "levels" && <ShellDialog title="Levels" icon={<BookIcon />} onClose={() => setOverlay(null)} primaryAction={startLevel} primaryLabel="Begin Hard Grove" />}
      {overlay === "daily" && <ShellDialog title="Daily" icon={<CalendarIcon />} onClose={() => setOverlay(null)} primaryAction={startLevel} primaryLabel="Play Daily" />}
      {overlay === "collection" && <CollectionDialog saveData={saveData} onClose={() => setOverlay(null)} onPlay={startLevel} />}
      {overlay === "win" && (
        <WinDialog
          stars={stars}
          elapsedMs={elapsedMs}
          moves={runtime.totalTickMoves}
          hintCount={runtime.hintCount}
          onRetry={startLevel}
          onMenu={() => {
            setScreen("menu");
            setOverlay(null);
          }}
        />
      )}
    </div>
  );
}

function MainMenu({
  onPlay,
  onOpenOverlay,
  saveData
}: {
  onPlay: () => void;
  onOpenOverlay: (overlay: Overlay) => void;
  saveData: SaveData;
}) {
  const completed = Object.values(saveData.levelProgress).filter((progress) => progress.solved).length;

  return (
    <main className="menu-screen">
      <div className="fireflies" aria-hidden="true" />
      <section className="title-medallion" aria-label="Project Circles">
        <span>Project</span>
        <strong>Circles</strong>
      </section>
      <button className="play-button" onClick={onPlay}>
        Play
      </button>
      <nav className="menu-actions" aria-label="Main menu">
        <MenuRow icon={<CalendarIcon />} label="Daily" onClick={() => onOpenOverlay("daily")} meta="Moon seed" />
        <MenuRow icon={<BookIcon />} label="Levels" onClick={() => onOpenOverlay("levels")} meta="Hard 1" />
        <MenuRow icon={<CollectionIcon />} label="Collection" onClick={() => onOpenOverlay("collection")} meta={`${completed}/1`} />
        <MenuRow icon={<SettingsIcon />} label="Settings" onClick={() => onOpenOverlay("settings")} meta="Audio" />
      </nav>
    </main>
  );
}

function MenuRow({
  icon,
  label,
  meta,
  onClick
}: {
  icon: React.ReactNode;
  label: string;
  meta: string;
  onClick: () => void;
}) {
  return (
    <button className="menu-row" onClick={onClick}>
      <span className="row-icon">{icon}</span>
      <span>{label}</span>
      <small>{meta}</small>
      <ChevronIcon className="chevron" />
    </button>
  );
}

function PuzzleScreen({
  runtime,
  overlay,
  showReference,
  settings,
  onDispatch,
  onMenu,
  onOpenOverlay,
  onToggleReference
}: {
  runtime: RuntimeState;
  overlay: Overlay;
  showReference: boolean;
  settings: UserSettings;
  onDispatch: (action: GameAction) => void;
  onMenu: () => void;
  onOpenOverlay: (overlay: Overlay) => void;
  onToggleReference: () => void;
}) {
  return (
    <main className="game-screen">
      <div className="grove-vignette" aria-hidden="true" />
      <header className="hud-top">
        <div className="moves-plaque">
          <span>Moves</span>
          <strong>{runtime.totalTickMoves}</strong>
          <em>/ {demoLevel.moveBudget}</em>
        </div>
        <IconButton label="Undo" onClick={() => onDispatch({ type: "undo" })} disabled={runtime.moveHistory.length === 0}>
          <UndoIcon />
        </IconButton>
        <IconButton label="Hint" badge={runtime.hintCount > 0 ? String(runtime.hintCount) : undefined} onClick={() => onDispatch({ type: "requestHint" })}>
          <HintIcon />
        </IconButton>
        <IconButton label="Map" onClick={() => onOpenOverlay("coupling")}>
          <MapIcon />
        </IconButton>
        <button className="difficulty-badge" onClick={() => onOpenOverlay("levels")}>
          <span>Hard</span>
          <strong aria-label="Three stars">***</strong>
        </button>
      </header>

      <section className="playfield" aria-label="Puzzle playfield">
        <PuzzleCanvas
          level={demoLevel}
          runtime={runtime}
          inputLocked={overlay !== null}
          highContrast={settings.highContrastBorders}
          dispatch={onDispatch}
        />
      </section>

      <button className={["reference-medallion", showReference ? "is-open" : ""].join(" ")} onClick={onToggleReference} aria-label="Toggle reference thumbnail">
        <img src={assets.referenceMedallion} alt="" aria-hidden="true" />
        {showReference ? <img className="reference-image" src={assets.puzzleGrove.src} alt={assets.puzzleGrove.alt} /> : <ImageIcon />}
        <span>Ref</span>
      </button>

      <button className="coupling-medallion" onClick={() => onOpenOverlay("coupling")} aria-label="Open coupling map">
        <MapIcon />
        <span>Coupling</span>
      </button>

      <button className="pause-button" onClick={() => onOpenOverlay("settings")} aria-label="Open settings">
        <SettingsIcon />
      </button>

    </main>
  );
}

function IconButton({
  label,
  badge,
  disabled,
  onClick,
  children
}: {
  label: string;
  badge?: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button className="icon-button" aria-label={label} onClick={onClick} disabled={disabled}>
      <span className="icon-shell">{children}</span>
      {badge ? <span className="icon-badge">{badge}</span> : null}
      <span className="icon-label">{label}</span>
    </button>
  );
}

function SettingsDialog({
  settings,
  onChange,
  onResetProgress,
  onClose
}: {
  settings: UserSettings;
  onChange: (settings: UserSettings) => void;
  onResetProgress: () => void;
  onClose: () => void;
}) {
  const rows: Array<[keyof UserSettings, string]> = [
    ["reducedMotion", "Reduced motion"],
    ["soundEffects", "Sound effects"],
    ["music", "Music"],
    ["haptics", "Haptics"],
    ["showReferenceDefault", "Reference default"],
    ["highContrastBorders", "High contrast rings"]
  ];

  return (
    <ModalFrame title="Settings" onClose={onClose}>
      <div className="settings-list">
        {rows.map(([key, label]) => (
          <label className="toggle-row" key={key}>
            <span>{label}</span>
            <input
              type="checkbox"
              checked={settings[key]}
              onChange={(event) => onChange({ ...settings, [key]: event.currentTarget.checked })}
            />
          </label>
        ))}
      </div>
      <div className="dialog-actions">
        <button className="secondary-button" onClick={onResetProgress}>
          Reset Progress
        </button>
        <button className="primary-button" onClick={onClose}>
          Done
        </button>
      </div>
    </ModalFrame>
  );
}

function CouplingDrawer({ onClose }: { onClose: () => void }) {
  const edges = demoLevel.matrix.flatMap((row, visualRing) =>
    row.flatMap((factor, controlRing) => {
      if (controlRing === visualRing || factor === 0) {
        return [];
      }
      return [{ controlRing, visualRing, factor }];
    })
  );

  return (
    <ModalFrame title="Coupling" onClose={onClose} compact>
      <div className="coupling-map">
        {edges.map((edge) => (
          <div className="coupling-edge" key={`${edge.controlRing}-${edge.visualRing}`}>
            <span>Ring {edge.controlRing + 1}</span>
            <MapIcon />
            <span>Ring {edge.visualRing + 1}</span>
            <strong>x{edge.factor}</strong>
          </div>
        ))}
      </div>
      <button className="primary-button" onClick={onClose}>
        Close Map
      </button>
    </ModalFrame>
  );
}

function ShellDialog({
  title,
  icon,
  primaryLabel,
  primaryAction,
  onClose
}: {
  title: string;
  icon: React.ReactNode;
  primaryLabel: string;
  primaryAction: () => void;
  onClose: () => void;
}) {
  return (
    <ModalFrame title={title} onClose={onClose}>
      <div className="shell-preview">
        <span className="row-icon">{icon}</span>
        <img src={assets.puzzleGrove.src} alt={assets.puzzleGrove.alt} />
        <div>
          <strong>Grove Path</strong>
          <span>5 rings | 8 ticks | Hard</span>
        </div>
      </div>
      <button className="primary-button" onClick={primaryAction}>
        {primaryLabel}
      </button>
    </ModalFrame>
  );
}

function CollectionDialog({ saveData, onClose, onPlay }: { saveData: SaveData; onClose: () => void; onPlay: () => void }) {
  const unlocked = saveData.unlockedImageIds.includes(demoLevel.imageId);

  return (
    <ModalFrame title="Collection" onClose={onClose}>
      <div className="collection-tile">
        <img src={assets.puzzleGrove.src} alt={assets.puzzleGrove.alt} />
        <div>
          <strong>{unlocked ? "Grove Path" : "Locked Grove"}</strong>
          <span>{unlocked ? "Restored image" : "Hard | 5 rings"}</span>
        </div>
      </div>
      <button className="primary-button" onClick={onPlay}>
        Play
      </button>
    </ModalFrame>
  );
}

function WinDialog({
  stars,
  moves,
  elapsedMs,
  hintCount,
  onRetry,
  onMenu
}: {
  stars: number;
  moves: number;
  elapsedMs: number;
  hintCount: number;
  onRetry: () => void;
  onMenu: () => void;
}) {
  return (
    <ModalFrame title="Restored" onClose={onMenu}>
      <img className="win-image" src={assets.puzzleGrove.src} alt={assets.puzzleGrove.alt} />
      <div className="score-grid">
        <Score label="Stars" value={"*".repeat(stars)} />
        <Score label="Moves" value={`${moves} / ${demoLevel.moveBudget}`} />
        <Score label="Optimal" value={String(demoLevel.optimalTickCost)} />
        <Score label="Time" value={formatTime(elapsedMs)} />
        <Score label="Hints" value={String(hintCount)} />
      </div>
      <div className="dialog-actions">
        <button className="secondary-button" onClick={onRetry}>
          Retry
        </button>
        <button className="primary-button" onClick={onMenu}>
          Menu
        </button>
      </div>
    </ModalFrame>
  );
}

function Score({ label, value }: { label: string; value: string }) {
  return (
    <div className="score-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ModalFrame({
  title,
  compact,
  onClose,
  children
}: {
  title: string;
  compact?: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className={["modal-panel", compact ? "is-compact" : ""].join(" ")} role="dialog" aria-modal="true" aria-labelledby={`dialog-${title}`}>
        <header className="modal-header">
          <h2 id={`dialog-${title}`}>{title}</h2>
          <button className="close-button" aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

function formatTime(ms: number): string {
  const seconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}
