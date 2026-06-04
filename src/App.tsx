import { useEffect, useMemo, useState } from "react";
import { gameAudio } from "./audio/gameAudio";
import { MainMenu } from "./ui/screens/MainMenu";
import { DifficultySelection } from "./ui/screens/DifficultySelection";
import { LevelSelection } from "./ui/screens/LevelSelection";
import { ImageCollection } from "./ui/screens/ImageCollection";
import { PuzzleScreen } from "./ui/screens/PuzzleScreen";
import { AppSettings, defaultAppSettings, SettingsOverlay } from "./ui/screens/SettingsOverlay";
import { WinScreen, WinResult } from "./ui/screens/WinScreen";
import { defaultImagePresets, fixtureLevel } from "./ui/fixtureData";
import { DifficultyName, PuzzleImageSource } from "./ui/types";
import { BEST_SCORE_STORAGE_PREFIXES_TO_CLEAR, SETTINGS_STORAGE_KEY } from "./persistence/storageKeys";

type AppScreen = "menu" | "difficulty" | "levels" | "collection" | "puzzle";

function readStoredSettings(): AppSettings {
  try {
    const stored = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!stored) {
      return defaultAppSettings;
    }

    const parsed = JSON.parse(stored) as Partial<AppSettings>;
    return {
      ...defaultAppSettings,
      ...parsed,
      volume: normalizeStoredVolume(parsed.volume),
    };
  } catch {
    return defaultAppSettings;
  }
}

function normalizeStoredVolume(volume: unknown) {
  if (typeof volume !== "number" || !Number.isFinite(volume)) {
    return defaultAppSettings.volume;
  }

  return Math.min(1, Math.max(0, volume));
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

  useEffect(() => {
    gameAudio.preload();
    return () => gameAudio.stopMusic();
  }, []);

  useEffect(() => {
    gameAudio.setSettings({
      music: settings.music,
      soundEffects: settings.soundEffects,
      volume: settings.volume,
    });
  }, [settings.music, settings.soundEffects, settings.volume]);

  useEffect(() => {
    gameAudio.setMusicTrack(screen === "puzzle" ? "gameplay" : "menu");
  }, [screen]);

  const openScreen = (nextScreen: AppScreen) => {
    gameAudio.playSfx("uiSelect");
    setScreen(nextScreen);
  };

  const goBack = (nextScreen: AppScreen) => {
    gameAudio.playSfx("uiBack");
    setScreen(nextScreen);
  };

  const openLevels = (difficulty: DifficultyName) => {
    gameAudio.playSfx("uiSelect");
    setSelectedDifficulty(difficulty);
    setScreen("levels");
  };

  const startPuzzle = () => {
    gameAudio.playSfx("uiSelect");
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
    gameAudio.playSfx("uiSelect");
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
        if (BEST_SCORE_STORAGE_PREFIXES_TO_CLEAR.some((prefix) => key.startsWith(prefix))) {
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
          onDifficulty={() => openScreen("difficulty")}
          onCollection={() => openScreen("collection")}
          onSettings={() => {
            gameAudio.playSfx("uiSelect");
            setSettingsOpen(true);
          }}
        />
      ) : null}

      {screen === "difficulty" ? (
        <DifficultySelection onBack={() => goBack("menu")} onOpenLevels={openLevels} />
      ) : null}

      {screen === "levels" ? (
        <LevelSelection
          difficulty={selectedDifficulty}
          onBack={() => goBack("difficulty")}
          onStart={startPuzzle}
        />
      ) : null}

      {screen === "collection" ? (
        <ImageCollection
          images={imageChoices}
          selectedImageId={selectedImage.id}
          onBack={() => goBack("menu")}
          onSelectImage={(imageId) => {
            gameAudio.playSfx("uiSelect");
            setSelectedImageId(imageId);
          }}
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
          onMenu={() => goBack("menu")}
          onSettings={() => {
            gameAudio.playSfx("uiSelect");
            setSettingsOpen(true);
          }}
          onComplete={setResult}
        />
      ) : null}

      {settingsOpen ? (
        <SettingsOverlay
          settings={settings}
          onSettingsChange={updateSettings}
          onResetProgress={resetProgress}
          onClose={() => {
            gameAudio.playSfx("uiBack");
            setSettingsOpen(false);
          }}
          variant={screen === "puzzle" ? "puzzle" : "menu"}
        />
      ) : null}

      {result ? (
        <WinScreen
          result={result}
          onNext={startPuzzle}
          onRetry={startPuzzle}
          onMenu={() => {
            gameAudio.playSfx("uiBack");
            setResult(null);
            setScreen("menu");
          }}
        />
      ) : null}
    </div>
  );
}
