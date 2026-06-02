import { useState } from "react";
import { MainMenu } from "./ui/screens/MainMenu";
import { DifficultySelection } from "./ui/screens/DifficultySelection";
import { LevelSelection } from "./ui/screens/LevelSelection";
import { ImageCollection } from "./ui/screens/ImageCollection";
import { PuzzleScreen } from "./ui/screens/PuzzleScreen";
import { SettingsOverlay } from "./ui/screens/SettingsOverlay";
import { WinScreen, WinResult } from "./ui/screens/WinScreen";
import { fixtureLevel, winResult } from "./ui/fixtureData";
import { DifficultyName } from "./ui/types";

type AppScreen = "menu" | "difficulty" | "levels" | "collection" | "puzzle";

export function App() {
  const [screen, setScreen] = useState<AppScreen>("menu");
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyName>("medium");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [result, setResult] = useState<WinResult | null>(null);

  const openLevels = (difficulty: DifficultyName) => {
    setSelectedDifficulty(difficulty);
    setScreen("levels");
  };

  const startPuzzle = () => {
    setResult(null);
    setScreen("puzzle");
  };

  return (
    <div className="app-shell">
      {screen === "menu" ? (
        <MainMenu
          onPlay={startPuzzle}
          onDaily={startPuzzle}
          onDifficulty={() => setScreen("difficulty")}
          onCollection={() => setScreen("collection")}
          onSettings={() => setSettingsOpen(true)}
        />
      ) : null}

      {screen === "difficulty" ? (
        <DifficultySelection onBack={() => setScreen("menu")} onOpenLevels={openLevels} />
      ) : null}

      {screen === "levels" ? (
        <LevelSelection
          difficulty={selectedDifficulty}
          onBack={() => setScreen("difficulty")}
          onStart={startPuzzle}
        />
      ) : null}

      {screen === "collection" ? <ImageCollection onBack={() => setScreen("menu")} /> : null}

      {screen === "puzzle" ? (
        <PuzzleScreen
          level={fixtureLevel}
          inputBlocked={settingsOpen || result !== null}
          onMenu={() => setScreen("menu")}
          onSettings={() => setSettingsOpen(true)}
          onFixtureComplete={() => setResult(winResult)}
        />
      ) : null}

      {settingsOpen ? (
        <SettingsOverlay onClose={() => setSettingsOpen(false)} variant={screen === "puzzle" ? "puzzle" : "menu"} />
      ) : null}

      {result ? (
        <WinScreen
          result={result}
          onNext={startPuzzle}
          onRetry={startPuzzle}
          onMenu={() => {
            setResult(null);
            setScreen("menu");
          }}
        />
      ) : null}
    </div>
  );
}
