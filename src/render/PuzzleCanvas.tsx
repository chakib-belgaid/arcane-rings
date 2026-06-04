import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { assets } from "../assets";
import { getAffectedRings, getCurrentOffsets, getPreviewOffsets } from "../game/gameState";
import type { GameAction, Level, RuntimeState } from "../game/types";
import { modNorm } from "../math/mod";
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
  const dragRef = useRef<{ pointerId: number; ring: number; startAngle: number; snappedTicks: number } | null>(null);
  const runtimeRef = useRef(runtime);
  const highContrastRef = useRef(highContrast);
  const displayedOffsetsRef = useRef<number[]>([]);
  const animationRef = useRef<number | null>(null);
  const [imageReady, setImageReady] = useState(false);

  useEffect(() => {
    const image = new Image();
    image.src = assets.puzzleGrove.src;
    image.onload = () => {
      imageRef.current = image;
      setImageReady(true);
    };
  }, []);

  useEffect(() => () => cancelAnimation(), []);

  useLayoutEffect(() => {
    runtimeRef.current = runtime;
    highContrastRef.current = highContrast;
  });

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !imageReady || !image) {
      return;
    }

    const resizeAndDraw = () => {
      resizeCanvas();
      const offsets = getPreviewOffsets(level, runtimeRef.current);
      drawOffsets(offsets, runtimeRef.current.selectedRing);
    };

    resizeAndDraw();
    const resizeObserver = new ResizeObserver(resizeAndDraw);
    resizeObserver.observe(canvas);
    return () => resizeObserver.disconnect();
  }, [imageReady, level]);

  useLayoutEffect(() => {
    if (!imageReady || dragRef.current) {
      return;
    }

    resizeCanvas();
    animateToOffsets(getPreviewOffsets(level, runtime), runtime.selectedRing);
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
        cancelAnimation();
        dragRef.current = { pointerId: event.pointerId, ring, startAngle: angleFromPoint(event.clientX, event.clientY), snappedTicks: 0 };
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
        const rawTicks = delta / tickAngle;
        const snappedTicks = Math.round(rawTicks);
        if (snappedTicks !== drag.snappedTicks) {
          drag.snappedTicks = snappedTicks;
          dispatch({ type: "previewRotation", controlRing: drag.ring, deltaTicks: snappedTicks });
        }
        drawOffsets(getFractionalPreviewOffsets(drag.ring, rawTicks), drag.ring);
      }}
      onPointerUp={(event) => {
        const drag = dragRef.current;
        if (!drag) {
          return;
        }
        const angle = angleFromPoint(event.clientX, event.clientY);
        const delta = normalizeAngle(angle - drag.startAngle);
        const tickAngle = (Math.PI * 2) / level.q;
        const snappedTicks = Math.round(delta / tickAngle);
        dragRef.current = null;
        dispatch({ type: "commitRotation", controlRing: drag.ring, deltaTicks: snappedTicks });
      }}
      onPointerCancel={() => {
        dragRef.current = null;
        dispatch({ type: "selectRing", ring: null });
      }}
    />
  );

  function resizeCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const nextWidth = Math.round(rect.width * dpr);
    const nextHeight = Math.round(rect.height * dpr);
    if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
      canvas.width = nextWidth;
      canvas.height = nextHeight;
    }
  }

  function drawOffsets(offsets: number[], selectedRing: number | null) {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) {
      return;
    }

    const runtimeState = runtimeRef.current;
    displayedOffsetsRef.current = offsets;
    geometryRef.current = drawPuzzle(canvas, image, level, {
      offsets,
      selectedRing,
      affectedRings: getAffectedRings(level, selectedRing),
      highlightedRing: runtimeState.highlightedRing,
      solved: runtimeState.isSolved,
      highContrast: highContrastRef.current
    });
  }

  function getFractionalPreviewOffsets(controlRing: number, rawTicks: number): number[] {
    return getCurrentOffsets(level, runtimeRef.current).map((offset, ring) =>
      modNorm(offset + (level.matrix[ring]?.[controlRing] ?? 0) * rawTicks, level.q)
    );
  }

  function animateToOffsets(targetOffsets: number[], selectedRing: number | null) {
    cancelAnimation();

    const startOffsets = displayedOffsetsRef.current.length === targetOffsets.length
      ? displayedOffsetsRef.current
      : targetOffsets;
    const startedAt = performance.now();
    const duration = 180;

    const step = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const offsets = targetOffsets.map((target, index) =>
        modNorm((startOffsets[index] ?? target) + shortestOffsetDelta(startOffsets[index] ?? target, target, level.q) * eased, level.q)
      );
      drawOffsets(offsets, selectedRing);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(step);
      } else {
        animationRef.current = null;
      }
    };

    animationRef.current = requestAnimationFrame(step);
  }

  function cancelAnimation() {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }
}

function normalizeAngle(angle: number): number {
  let normalized = angle;
  while (normalized > Math.PI) normalized -= Math.PI * 2;
  while (normalized < -Math.PI) normalized += Math.PI * 2;
  return normalized;
}

function shortestOffsetDelta(start: number, end: number, q: number): number {
  const forward = modNorm(end - start, q);
  return forward > q / 2 ? forward - q : forward;
}
