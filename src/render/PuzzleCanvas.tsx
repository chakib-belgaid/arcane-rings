import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  beginPointerDrag,
  computeAffectedRings,
  computePreviewOffsets,
  finishPointerDrag,
  type PointerDragSession,
  updatePointerDrag,
} from "../interaction/pointerDrag";
import { balancedRingRadii } from "./ringRadii";
import { drawPuzzleRings } from "./ringRenderer";

export type PuzzleCanvasCommit = {
  controlRing: number;
  deltaTicks: number;
};

export type PuzzleCanvasPreview = PuzzleCanvasCommit & {
  affectedRings: number[];
  previewOffsets: number[];
};

export type PuzzleCanvasProps = {
  imageSrc: string;
  offsets: number[];
  matrix: number[][];
  q: number;
  size?: number;
  ringRadii?: number[];
  inputDisabled?: boolean;
  onPreview?: (preview: PuzzleCanvasPreview) => void;
  onCommit?: (move: PuzzleCanvasCommit) => void;
  onCancel?: () => void;
};

type AnimationPhase = "idle" | "settling";

const SETTLE_ROTATION_MS = 220;

function offsetsEqual(left: number[], right: number[]): boolean {
  if (left.length !== right.length) {
    return false;
  }
  return left.every((offset, index) => offset === right[index]);
}

function modTick(value: number, q: number): number {
  return ((value % q) + q) % q;
}

function shortestTickDelta(from: number, to: number, q: number): number {
  const forward = modTick(to - from, q);
  return forward > q / 2 ? forward - q : forward;
}

function easeOutQuint(progress: number): number {
  return 1 - Math.pow(1 - progress, 5);
}

function interpolateOffsets(from: number[], to: number[], q: number, progress: number): number[] {
  const eased = easeOutQuint(Math.max(0, Math.min(1, progress)));
  return to.map((target, ring) => {
    const start = from[ring] ?? target;
    return start + shortestTickDelta(start, target, q) * eased;
  });
}

function prefersReducedMotion(): boolean {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

function eventPoint(event: PointerEvent, canvas: HTMLCanvasElement): { px: number; py: number } {
  const bounds = canvas.getBoundingClientRect();
  return {
    px: event.clientX - bounds.left,
    py: event.clientY - bounds.top,
  };
}

export function PuzzleCanvas({
  imageSrc,
  offsets,
  matrix,
  q,
  size = 420,
  ringRadii,
  inputDisabled = false,
  onPreview,
  onCommit,
  onCancel,
}: PuzzleCanvasProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<(PointerDragSession & { pointerId: number }) | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const displayOffsetsRef = useRef<number[]>([...offsets]);
  const drawOffsetsRef = useRef<(nextOffsets: number[]) => void>(() => undefined);
  const [imageReady, setImageReady] = useState(false);
  const [renderSize, setRenderSize] = useState(size);
  const [selectedRing, setSelectedRing] = useState<number | null>(null);
  const [previewTicks, setPreviewTicks] = useState(0);
  const [animationPhase, setAnimationPhase] = useState<AnimationPhase>("idle");
  const canvasSize = Math.max(1, renderSize);

  const resolvedRadii = useMemo(
    () => ringRadii ?? balancedRingRadii(canvasSize * 0.452, offsets.length),
    [canvasSize, offsets.length, ringRadii],
  );
  const affectedRings = useMemo(
    () => computeAffectedRings(matrix, selectedRing, q),
    [matrix, q, selectedRing],
  );
  const renderOffsets = useMemo(() => {
    if (selectedRing === null || previewTicks === 0) {
      return displayOffsetsRef.current;
    }
    return computePreviewOffsets(offsets, matrix, selectedRing, previewTicks, q);
  }, [matrix, offsets, previewTicks, q, selectedRing]);

  const drawOffsets = useCallback(
    (nextOffsets: number[]) => {
      const canvas = canvasRef.current;
      const image = imageRef.current;
      if (!canvas || !imageReady || !image) {
        return;
      }

      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.round(canvasSize * ratio);
      canvas.height = Math.round(canvasSize * ratio);
      canvas.style.width = "100%";
      canvas.style.height = "100%";

      const context = canvas.getContext("2d");
      if (!context) {
        return;
      }

      context.save();
      context.scale(ratio, ratio);
      drawPuzzleRings(context, {
        image,
        width: canvasSize,
        height: canvasSize,
        ringRadii: resolvedRadii,
        offsets: nextOffsets,
        q,
        selectedRing,
        affectedRings,
        previewTicks,
      });
      context.restore();
    },
    [affectedRings, canvasSize, imageReady, previewTicks, q, resolvedRadii, selectedRing],
  );

  useEffect(() => {
    drawOffsetsRef.current = drawOffsets;
  }, [drawOffsets]);

  const stopSettlingFrame = useCallback(() => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const cancelSettlingAnimation = useCallback((nextOffsets?: number[]) => {
    stopSettlingFrame();

    if (nextOffsets) {
      displayOffsetsRef.current = [...nextOffsets];
      drawOffsetsRef.current(displayOffsetsRef.current);
    }

    setAnimationPhase("idle");
  }, [stopSettlingFrame]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }

    const updateSize = () => {
      const bounds = host.getBoundingClientRect();
      const nextSize = Math.round(Math.min(bounds.width, bounds.height || bounds.width));
      if (nextSize > 0) {
        setRenderSize(nextSize);
      }
    };

    updateSize();

    if (typeof window.ResizeObserver === "undefined") {
      window.addEventListener("resize", updateSize);
      return () => window.removeEventListener("resize", updateSize);
    }

    const observer = new window.ResizeObserver(updateSize);
    observer.observe(host);
    return () => observer.disconnect();
  }, [size]);

  useEffect(() => {
    const image = new window.Image();
    image.decoding = "async";
    setImageReady(false);
    image.onload = () => {
      imageRef.current = image;
      setImageReady(true);
    };
    image.onerror = () => {
      imageRef.current = null;
      setImageReady(false);
    };
    image.src = imageSrc;
    return () => {
      image.onload = null;
      image.onerror = null;
    };
  }, [imageSrc]);

  useEffect(() => {
    const activePreview = selectedRing !== null && previewTicks !== 0;
    if (activePreview) {
      drawOffsets(renderOffsets);
      return;
    }

    if (animationPhase !== "settling") {
      drawOffsets(displayOffsetsRef.current);
    }
  }, [animationPhase, drawOffsets, previewTicks, renderOffsets, selectedRing]);

  useEffect(() => {
    const targetOffsets = [...offsets];
    if (offsetsEqual(displayOffsetsRef.current, targetOffsets)) {
      cancelSettlingAnimation();
      return;
    }

    if (prefersReducedMotion()) {
      cancelSettlingAnimation(targetOffsets);
      return;
    }

    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    const startOffsets = [...displayOffsetsRef.current];
    const startTime = window.performance.now();
    setAnimationPhase("settling");

    const settle = (time: number) => {
      const progress = Math.min((time - startTime) / SETTLE_ROTATION_MS, 1);
      const nextOffsets = interpolateOffsets(startOffsets, targetOffsets, q, progress);
      displayOffsetsRef.current = nextOffsets;
      drawOffsetsRef.current(nextOffsets);

      if (progress < 1) {
        animationFrameRef.current = window.requestAnimationFrame(settle);
        return;
      }

      animationFrameRef.current = null;
      displayOffsetsRef.current = targetOffsets;
      drawOffsetsRef.current(targetOffsets);
      setAnimationPhase("idle");
    };

    animationFrameRef.current = window.requestAnimationFrame(settle);
  }, [cancelSettlingAnimation, offsets, q]);

  useEffect(() => () => stopSettlingFrame(), [stopSettlingFrame]);

  const cancelDrag = useCallback(() => {
    if (!dragRef.current) {
      return;
    }
    dragRef.current = null;
    setSelectedRing(null);
    setPreviewTicks(0);
    onCancel?.();
  }, [onCancel]);

  useEffect(() => {
    if (inputDisabled) {
      cancelDrag();
    }
  }, [cancelDrag, inputDisabled]);

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (inputDisabled || !canvasRef.current) {
      return;
    }

    const point = eventPoint(event.nativeEvent, canvasRef.current);
    const session = beginPointerDrag({
      ...point,
      cx: canvasSize / 2,
      cy: canvasSize / 2,
      ringRadii: resolvedRadii,
      q,
    });

    if (!session) {
      return;
    }

    cancelSettlingAnimation(offsets);
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { ...session, pointerId: event.pointerId };
    setSelectedRing(session.controlRing);
    setPreviewTicks(0);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const session = dragRef.current;
    if (!session || session.pointerId !== event.pointerId || !canvasRef.current) {
      return;
    }

    const point = eventPoint(event.nativeEvent, canvasRef.current);
    const ticks = updatePointerDrag(session, {
      ...point,
      cx: canvasSize / 2,
      cy: canvasSize / 2,
    });
    const affected = computeAffectedRings(matrix, session.controlRing, q);
    setPreviewTicks(ticks);
    onPreview?.({
      controlRing: session.controlRing,
      deltaTicks: ticks,
      affectedRings: affected,
      previewOffsets: computePreviewOffsets(offsets, matrix, session.controlRing, ticks, q),
    });
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const session = dragRef.current;
    if (!session || session.pointerId !== event.pointerId) {
      return;
    }

    const committedMove = finishPointerDrag(session);
    dragRef.current = null;
    setSelectedRing(null);
    setPreviewTicks(0);

    if (committedMove) {
      onCommit?.(committedMove);
    } else {
      onCancel?.();
    }
  };

  return (
    <div
      ref={hostRef}
      className="puzzle-canvas-host"
      data-testid="puzzle-canvas-host"
      data-selected-ring={selectedRing ?? ""}
      data-preview-ticks={previewTicks}
      data-affected-rings={affectedRings.join(",")}
      data-offsets={offsets.join(",")}
      data-animation-phase={animationPhase}
    >
      <canvas
        ref={canvasRef}
        className="puzzle-canvas"
        data-testid="puzzle-canvas"
        aria-label="Project Circles puzzle canvas"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={cancelDrag}
        onLostPointerCapture={cancelDrag}
      />
    </div>
  );
}
