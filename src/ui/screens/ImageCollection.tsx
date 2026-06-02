import { ChangeEvent, useRef, useState } from "react";
import { ArrowLeft, Check, ImagePlus, Play, Star, Upload } from "lucide-react";

import { IconButton } from "../components/IconButton";
import { PuzzleImageSource } from "../types";

type ImageCollectionProps = {
  images: PuzzleImageSource[];
  selectedImageId: string;
  onBack: () => void;
  onSelectImage: (imageId: string) => void;
  onUploadImage: (file: File, dataUrl: string) => void;
  onStart: () => void;
};

export function ImageCollection({
  images,
  selectedImageId,
  onBack,
  onSelectImage,
  onUploadImage,
  onStart,
}: ImageCollectionProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setUploadError("Choose an image file.");
      return;
    }

    const reader = new window.FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setUploadError("Image upload failed.");
        return;
      }

      setUploadError(null);
      onUploadImage(file, reader.result);
    };
    reader.onerror = () => setUploadError("Image upload failed.");
    reader.readAsDataURL(file);
  };

  return (
    <main className="screen-band collection-screen">
      <header className="screen-header">
        <IconButton icon={ArrowLeft} label="Back to menu" onClick={onBack} />
        <h1>Image Collection</h1>
      </header>
      <section className="collection-toolbar" aria-label="Image source actions">
        <input
          ref={fileInputRef}
          data-testid="image-upload-input"
          type="file"
          accept="image/*"
          hidden
          onChange={handleFileChange}
        />
        <IconButton icon={Upload} label="Upload image" text="Upload image" onClick={() => fileInputRef.current?.click()} />
        <IconButton icon={Play} label="Play selected image" text="Play selected" variant="primary" onClick={onStart} />
      </section>
      {uploadError ? <p className="collection-error">{uploadError}</p> : null}
      <section className="collection-grid" aria-label="Restored image archive">
        {images.map((item) => {
          const isSelected = item.id === selectedImageId;
          return (
            <button
              className={`collection-item collection-item--button${isSelected ? " collection-item--selected" : ""}`}
              key={item.id}
              type="button"
              aria-pressed={isSelected}
              aria-label={`Select ${item.title}`}
              onClick={() => onSelectImage(item.id)}
            >
              <span className="collection-thumb" aria-hidden="true">
                <img src={item.src} alt="" />
              </span>
              <span className="collection-copy">
              <h2>{item.title}</h2>
              <p>{item.difficulty}</p>
              <div className="collection-meta">
                {item.stars > 0 ? (
                  <span>
                    {item.stars} <Star aria-hidden="true" size={14} fill="currentColor" />
                  </span>
                ) : (
                  <span>
                    <ImagePlus aria-hidden="true" size={14} />
                    {item.source === "upload" ? "Uploaded" : "Preset"}
                  </span>
                )}
                <span>{item.bestMoves === null ? "Unplayed" : `Best moves ${item.bestMoves}`}</span>
                <span>Unlocked {item.unlockedAt}</span>
              </div>
              </span>
              <span className="collection-selected" aria-hidden="true">
                {isSelected ? <Check size={18} /> : null}
              </span>
            </button>
          );
        })}
      </section>
    </main>
  );
}
