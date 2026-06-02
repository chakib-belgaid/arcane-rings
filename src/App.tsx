import { useState } from "react";
import { modNorm } from "./interaction/pointerDrag";
import { sampleImageDataUrl } from "./fixtures/sampleImage";
import { PuzzleCanvas, type PuzzleCanvasCommit } from "./render/PuzzleCanvas";

const q = 8;
const matrix = [
  [1, 0, 0],
  [1, 1, 0],
  [0, 1, 1],
];

export function App() {
  const [offsets, setOffsets] = useState([0, 0, 0]);

  const handleCommit = ({ controlRing, deltaTicks }: PuzzleCanvasCommit) => {
    setOffsets((currentOffsets) =>
      currentOffsets.map((offset, ring) =>
        modNorm(offset + (matrix[ring]?.[controlRing] ?? 0) * deltaTicks, q),
      ),
    );
  };

  return (
    <main className="renderer-harness">
      <PuzzleCanvas
        imageSrc={sampleImageDataUrl()}
        offsets={offsets}
        matrix={matrix}
        q={q}
        onCommit={handleCommit}
      />
    </main>
  );
}
