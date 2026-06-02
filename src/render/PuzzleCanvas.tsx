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
  const [imageReady, setImageReady] = useState(false);
  const [renderSize, setRenderSize] = useState(size);
  const [selectedRing, setSelectedRing] = useState<number | null>(null);
  const [previewTicks, setPreviewTicks] = useState(0);
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
      return offsets;
    }
    return computePreviewOffsets(offsets, matrix, selectedRing, previewTicks, q);
  }, [matrix, offsets, previewTicks, q, selectedRing]);

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
      offsets: renderOffsets,
      q,
      selectedRing,
      affectedRings,
      previewTicks,
    });
    context.restore();
  }, [affectedRings, canvasSize, imageReady, previewTicks, q, renderOffsets, resolvedRadii, selectedRing]);

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
