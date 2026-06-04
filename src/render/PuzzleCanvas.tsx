import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { assets } from "../assets";
import { getAffectedRings, getPreviewOffsets } from "../game/gameState";
import type { GameAction, Level, RuntimeState } from "../game/types";
import { drawPuzzle, type PuzzleGeometry } from "./ringRenderer";

type PuzzleCanvasProps = {
  level: Level;
  runtime: RuntimeState;
  inputLocked: boolean;
  highContrast: boolean;
  dispatch: (action: GameAction) => void;
};

export function PuzzleCanvas({ level, runtime, inputLocked, highContrast, dispatch }: PuzzleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const geometryRef = useRef<PuzzleGeometry | null>(null);
  const dragRef = useRef<{ pointerId: number; ring: number; startAngle: number } | null>(null);
  const [imageReady, setImageReady] = useState(false);

  useEffect(() => {
    const image = new Image();
    image.src = assets.puzzleGrove.src;
    image.onload = () => {
      imageRef.current = image;
      setImageReady(true);
    };
  }, []);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !imageReady || !image) {
      return;
    }

    const resizeAndDraw = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      geometryRef.current = drawPuzzle(canvas, image, level, {
        offsets: getPreviewOffsets(level, runtime),
        selectedRing: runtime.selectedRing,
        affectedRings: getAffectedRings(level, runtime.selectedRing),
        highlightedRing: runtime.highlightedRing,
        solved: runtime.isSolved,
        highContrast
      });
    };

    resizeAndDraw();
    const resizeObserver = new ResizeObserver(resizeAndDraw);
    resizeObserver.observe(canvas);
    return () => resizeObserver.disconnect();
  }, [highContrast, imageReady, level, runtime]);

  function ringFromPoint(clientX: number, clientY: number): number | null {
    const canvas = canvasRef.current;
    const geometry = geometryRef.current;
    if (!canvas || !geometry) {
      return null;
    }

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    const distance = Math.hypot(x - geometry.centerX, y - geometry.centerY);
    const ratio = distance / geometry.radius;
    const ring = level.ringRadii.findIndex((outerRatio, index) => ratio <= outerRatio && ratio > (level.ringRadii[index - 1] ?? 0));
    if (ring === -1) {
      return null;
    }
    return ring;
  }

  function angleFromPoint(clientX: number, clientY: number): number {
    const canvas = canvasRef.current;
    const geometry = geometryRef.current;
    if (!canvas || !geometry) {
      return 0;
    }

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    return Math.atan2(y - geometry.centerY, x - geometry.centerX);
  }

  return (
    <canvas
      ref={canvasRef}
      className="puzzle-canvas"
      aria-label="Circular enchanted grove puzzle"
      onPointerDown={(event) => {
        if (inputLocked) {
          return;
        }
        const ring = ringFromPoint(event.clientX, event.clientY);
        if (ring === null) {
          return;
        }
        event.currentTarget.setPointerCapture(event.pointerId);
        dragRef.current = { pointerId: event.pointerId, ring, startAngle: angleFromPoint(event.clientX, event.clientY) };
        dispatch({ type: "selectRing", ring });
      }}
      onPointerMove={(event) => {
        const drag = dragRef.current;
        if (!drag || inputLocked) {
          return;
        }
        const angle = angleFromPoint(event.clientX, event.clientY);
        const delta = normalizeAngle(angle - drag.startAngle);
        const tickAngle = (Math.PI * 2) / level.q;
        dispatch({ type: "previewRotation", controlRing: drag.ring, deltaTicks: Math.round(delta / tickAngle) });
      }}
      onPointerUp={(event) => {
        const drag = dragRef.current;
        if (!drag) {
          return;
        }
        const angle = angleFromPoint(event.clientX, event.clientY);
        const delta = normalizeAngle(angle - drag.startAngle);
        const tickAngle = (Math.PI * 2) / level.q;
        dragRef.current = null;
        dispatch({ type: "commitRotation", controlRing: drag.ring, deltaTicks: Math.round(delta / tickAngle) });
      }}
      onPointerCancel={() => {
        dragRef.current = null;
        dispatch({ type: "selectRing", ring: null });
      }}
    />
  );
}

function normalizeAngle(angle: number): number {
  let normalized = angle;
  while (normalized > Math.PI) normalized -= Math.PI * 2;
  while (normalized < -Math.PI) normalized += Math.PI * 2;
  return normalized;
}
