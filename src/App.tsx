import { useMemo, useState } from "react";
import { MainMenu } from "./ui/screens/MainMenu";
import { DifficultySelection } from "./ui/screens/DifficultySelection";
import { LevelSelection } from "./ui/screens/LevelSelection";
import { ImageCollection } from "./ui/screens/ImageCollection";
import { PuzzleScreen } from "./ui/screens/PuzzleScreen";
import { SettingsOverlay } from "./ui/screens/SettingsOverlay";
import { WinScreen, WinResult } from "./ui/screens/WinScreen";
import { defaultImagePresets, fixtureLevel } from "./ui/fixtureData";
import { DifficultyName, PuzzleImageSource } from "./ui/types";

type AppScreen = "menu" | "difficulty" | "levels" | "collection" | "puzzle";

export function App() {
  const [screen, setScreen] = useState<AppScreen>("menu");
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyName>("medium");
  const [uploadedImages, setUploadedImages] = useState<PuzzleImageSource[]>([]);
  const [selectedImageId, setSelectedImageId] = useState(defaultImagePresets[0].id);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [result, setResult] = useState<WinResult | null>(null);
  const [puzzleSessionId, setPuzzleSessionId] = useState(0);
  const imageChoices = useMemo(() => [...defaultImagePresets, ...uploadedImages], [uploadedImages]);
  const selectedImage = imageChoices.find((image) => image.id === selectedImageId) ?? defaultImagePresets[0];

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
          onMenu={() => setScreen("menu")}
          onSettings={() => setSettingsOpen(true)}
          onComplete={setResult}
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
