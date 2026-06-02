import { ArrowLeft, Star } from "lucide-react";

import { IconButton } from "../components/IconButton";
import { collectionItems } from "../fixtureData";

type ImageCollectionProps = {
  onBack: () => void;
};

export function ImageCollection({ onBack }: ImageCollectionProps) {
  return (
    <main className="screen-band collection-screen">
      <header className="screen-header">
        <IconButton icon={ArrowLeft} label="Back to menu" onClick={onBack} />
        <h1>Image Collection</h1>
      </header>
      <section className="collection-grid" aria-label="Restored image archive">
        {collectionItems.map((item) => (
          <article className="collection-item" key={item.id}>
            <div className="collection-thumb" aria-hidden="true">
              <span className="thumb-rings" />
            </div>
            <div>
              <h2>{item.title}</h2>
              <p>{item.difficulty}</p>
              <div className="collection-meta">
                <span>
                  {item.stars} <Star aria-hidden="true" size={14} fill="currentColor" />
                </span>
                <span>Best moves {item.bestMoves}</span>
                <span>Unlocked {item.unlockedAt}</span>
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
