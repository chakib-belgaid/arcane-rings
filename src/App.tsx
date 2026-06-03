import { useMemo, useState } from "react";
import { MainMenu } from "./ui/screens/MainMenu";
import { DifficultySelection } from "./ui/screens/DifficultySelection";
import { LevelSelection } from "./ui/screens/LevelSelection";
import { ImageCollection } from "./ui/screens/ImageCollection";
import { PuzzleScreen } from "./ui/screens/PuzzleScreen";
import { AppSettings, defaultAppSettings, SettingsOverlay } from "./ui/screens/SettingsOverlay";
import { WinScreen, WinResult } from "./ui/screens/WinScreen";
import { defaultImagePresets, fixtureLevel } from "./ui/fixtureData";
import { DifficultyName, PuzzleImageSource } from "./ui/types";

type AppScreen = "menu" | "difficulty" | "levels" | "collection" | "puzzle";

const SETTINGS_STORAGE_KEY = "project-circles:settings";
const BEST_SCORE_PREFIX = "project-circles:best-score:";

function readStoredSettings(): AppSettings {
  try {
    const stored = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!stored) {
      return defaultAppSettings;
    }

    return { ...defaultAppSettings, ...(JSON.parse(stored) as Partial<AppSettings>) };
  } catch {
    return defaultAppSettings;
  }
}

function shouldExposeFixtureControls(): boolean {
  if (import.meta.env.MODE === "test") {
    return true;
  }

  try {
    return new URLSearchParams(window.location.search).has("fixtureControls");
  } catch {
    return false;
  }
}

export function App() {
  const [screen, setScreen] = useState<AppScreen>("menu");
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyName>("medium");
  const [uploadedImages, setUploadedImages] = useState<PuzzleImageSource[]>([]);
  const [selectedImageId, setSelectedImageId] = useState(defaultImagePresets[0].id);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(() => readStoredSettings());
  const [result, setResult] = useState<WinResult | null>(null);
  const [puzzleSessionId, setPuzzleSessionId] = useState(0);
  const imageChoices = useMemo(() => [...defaultImagePresets, ...uploadedImages], [uploadedImages]);
  const selectedImage = imageChoices.find((image) => image.id === selectedImageId) ?? defaultImagePresets[0];
  const fixtureControlsEnabled = useMemo(() => shouldExposeFixtureControls(), []);

  const openLevels = (difficulty: DifficultyName) => {
    setSelectedDifficulty(difficulty);
    setScreen("levels");
  };

  const startPuzzle = () => {
    setResult(null);
    setPuzzleSessionId((sessionId) => sessionId + 1);
    setScreen("puzzle");
  };

  const addUploadedImage = (file: File, dataUrl: string) => {
    const title =
      file.name
        .replace(/\.[^.]+$/, "")
        .replace(/[-_]+/g, " ")
        .trim() || "Uploaded Image";
    const uploadedImage: PuzzleImageSource = {
      id: `upload-${Date.now()}-${file.name}`,
      title,
      src: dataUrl,
      source: "upload",
      stars: 0,
      difficulty: "beginner",
      bestMoves: null,
      unlockedAt: new Date().toISOString().slice(0, 10),
    };

    setUploadedImages((images) => [uploadedImage, ...images]);
    setSelectedImageId(uploadedImage.id);
  };

  const updateSettings = (nextSettings: AppSettings) => {
    setSettings(nextSettings);
    try {
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(nextSettings));
    } catch {
      // Settings are still usable for the current session if storage is unavailable.
    }
  };

  const resetProgress = () => {
    try {
      for (const key of Object.keys(window.localStorage)) {
        if (key.startsWith(BEST_SCORE_PREFIX)) {
          window.localStorage.removeItem(key);
        }
      }
    } catch {
      // Progress reset is best-effort when browser storage is unavailable.
    }
  };

  return (
    <div
      className="app-shell"
      data-reduced-motion={settings.reducedMotion ? "true" : undefined}
      data-high-contrast={settings.highContrastBorders ? "true" : undefined}
      data-colorblind-coupling={settings.colorblindCoupling ? "true" : undefined}
    >
      {screen === "menu" ? (
        <MainMenu
          onPlay={startPuzzle}
          onDaily={startPuzzle}
          dailyDisabled
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

      {screen === "collection" ? (
        <ImageCollection
          images={imageChoices}
          selectedImageId={selectedImage.id}
          onBack={() => setScreen("menu")}
          onSelectImage={setSelectedImageId}
          onUploadImage={addUploadedImage}
          onStart={startPuzzle}
        />
      ) : null}

      {screen === "puzzle" ? (
        <PuzzleScreen
          key={`${selectedImage.id}-${puzzleSessionId}`}
          level={fixtureLevel}
          imageSrc={selectedImage.src}
          imageTitle={selectedImage.title}
          inputBlocked={settingsOpen || result !== null}
          referenceDefault={settings.referenceDefault}
          colorblindCoupling={settings.colorblindCoupling}
          fixtureControlsEnabled={fixtureControlsEnabled}
          onMenu={() => setScreen("menu")}
          onSettings={() => setSettingsOpen(true)}
          onFixtureComplete={setResult}
        />
      ) : null}

      {settingsOpen ? (
        <SettingsOverlay
          settings={settings}
          onSettingsChange={updateSettings}
          onResetProgress={resetProgress}
          onClose={() => setSettingsOpen(false)}
          variant={screen === "puzzle" ? "puzzle" : "menu"}
        />
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
