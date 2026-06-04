import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent
} from "react";
import { assets } from "../assets";
import { getAffectedRings, getCurrentOffsets, getPreviewOffsets } from "../game/gameState";
import type { GameAction, Level, RuntimeState } from "../game/types";
import {
  beginPointerDrag,
  computeAffectedRings,
  computePreviewOffsets as computeImagePreviewOffsets,
  finishPointerDrag,
  type PointerDragSession,
  updatePointerDrag
} from "../interaction/pointerDrag";
import { modNorm } from "../math/mod";
import { balancedRingRadii } from "./ringRadii";
import { drawPuzzle, drawPuzzleRings, type PuzzleGeometry, type RingBurst } from "./ringRenderer";

type RuntimePuzzleCanvasProps = {
  level: Level;
  runtime: RuntimeState;
  inputLocked: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  dispatch: (action: GameAction) => void;
};

export type PuzzleCanvasCommit = {
  controlRing: number;
  deltaTicks: number;
};

export type PuzzleCanvasPreview = PuzzleCanvasCommit & {
  affectedRings: number[];
  previewOffsets: number[];
  previewDeltaTicks: number;
};

export type ImagePuzzleCanvasProps = {
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

export type PuzzleCanvasProps = RuntimePuzzleCanvasProps | ImagePuzzleCanvasProps;

type AnimationPhase = "idle" | "settling";

const COMMIT_BURST_DURATION = 560;
const SETTLE_ROTATION_MS = 220;

export function PuzzleCanvas(props: PuzzleCanvasProps) {
  if ("level" in props) {
    return <RuntimePuzzleCanvas {...props} />;
  }

  return <ImagePuzzleCanvas {...props} />;
}

function RuntimePuzzleCanvas({
  level,
  runtime,
  inputLocked,
  highContrast,
  reducedMotion,
  dispatch
}: RuntimePuzzleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const geometryRef = useRef<PuzzleGeometry | null>(null);
  const dragRef = useRef<{ pointerId: number; ring: number; startAngle: number; snappedTicks: number } | null>(null);
  const runtimeRef = useRef(runtime);
  const highContrastRef = useRef(highContrast);
  const reducedMotionRef = useRef(reducedMotion);
  const displayedOffsetsRef = useRef<number[]>([]);
  const animationRef = useRef<number | null>(null);
  const commitBurstRef = useRef<RingBurst | null>(null);
  const lastMoveCountRef = useRef(runtime.moveHistory.length);
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
    reducedMotionRef.current = reducedMotion;

    if (runtime.moveHistory.length < lastMoveCountRef.current) {
      commitBurstRef.current = null;
    }

    if (runtime.moveHistory.length > lastMoveCountRef.current) {
      const lastMove = runtime.moveHistory.at(-1);
      if (lastMove) {
        commitBurstRef.current = { ring: lastMove.controlRing, startedAtMs: performance.now() };
      }
    }

    lastMoveCountRef.current = runtime.moveHistory.length;
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
  }, [highContrast, imageReady, level, reducedMotion, runtime]);

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
    const ring = level.ringRadii.findIndex(
      (outerRatio, index) => ratio <= outerRatio && ratio > (level.ringRadii[index - 1] ?? 0)
    );
    return ring === -1 ? null : ring;
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
        dragRef.current = {
          pointerId: event.pointerId,
          ring,
          startAngle: angleFromPoint(event.clientX, event.clientY),
          snappedTicks: 0
        };
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

  function drawOffsets(offsets: number[], selectedRing: number | null, nowMs = performance.now()) {
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
      highContrast: highContrastRef.current,
      effects: {
        nowMs,
        reducedMotion: reducedMotionRef.current,
        commitBurst: commitBurstRef.current,
        dragRing: dragRef.current?.ring ?? null
      }
    });
  }

  function getFractionalPreviewOffsets(controlRing: number, rawTicks: number): number[] {
    return getCurrentOffsets(level, runtimeRef.current).map((offset, ring) =>
      modNorm(offset + (level.matrix[ring]?.[controlRing] ?? 0) * rawTicks, level.q)
    );
  }

  function animateToOffsets(targetOffsets: number[], selectedRing: number | null) {
    cancelAnimation();

    if (reducedMotionRef.current) {
      drawOffsets(targetOffsets, selectedRing);
      commitBurstRef.current = null;
      return;
    }

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
      drawOffsets(offsets, selectedRing, now);

      if (progress < 1 || hasLiveEffects(now)) {
        animationRef.current = requestAnimationFrame(step);
      } else {
        animationRef.current = null;
      }
    };

    animationRef.current = requestAnimationFrame(step);
  }

  function hasLiveEffects(nowMs: number): boolean {
    const commitBurst = commitBurstRef.current;
    if (!commitBurst) {
      return false;
    }

    if (nowMs - commitBurst.startedAtMs <= COMMIT_BURST_DURATION) {
      return true;
    }

    commitBurstRef.current = null;
    return false;
  }

  function cancelAnimation() {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }
}

function ImagePuzzleCanvas({
  imageSrc,
  offsets,
  matrix,
  q,
  size = 420,
  ringRadii,
  inputDisabled = false,
  onPreview,
  onCommit,
  onCancel
}: ImagePuzzleCanvasProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<(PointerDragSession & { canvasSize: number; pointerId: number }) | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const settleRunRef = useRef(0);
  const settleTimeoutRef = useRef<number | null>(null);
  const canvasBackingRef = useRef({ height: 0, width: 0 });
  const displayOffsetsRef = useRef<number[]>([...offsets]);
  const previewBaseOffsetsRef = useRef<number[] | null>(null);
  const drawOffsetsRef = useRef<(nextOffsets: number[]) => void>(() => undefined);
  const [imageReady, setImageReady] = useState(false);
  const [renderSize, setRenderSize] = useState(size);
  const [selectedRing, setSelectedRing] = useState<number | null>(null);
  const [previewTicks, setPreviewTicks] = useState(0);
  const [previewDeltaTicks, setPreviewDeltaTicks] = useState(0);
  const [animationPhase, setAnimationPhase] = useState<AnimationPhase>("idle");
  const canvasSize = Math.max(1, renderSize);

  const resolvedRadii = useMemo(
    () => ringRadii ?? balancedRingRadii(canvasSize * 0.452, offsets.length),
    [canvasSize, offsets.length, ringRadii]
  );
  const affectedRings = useMemo(
    () => computeAffectedRings(matrix, selectedRing, q),
    [matrix, q, selectedRing]
  );
  const previewOffsetsFor = useCallback(
    (controlRing: number, ticks: number) =>
      computeImagePreviewOffsets(
        previewBaseOffsetsRef.current ?? displayOffsetsRef.current,
        matrix,
        controlRing,
        ticks,
        q
      ),
    [matrix, q]
  );

  const drawOffsets = useCallback(
    (nextOffsets: number[]) => {
      const canvas = canvasRef.current;
      const image = imageRef.current;
      if (!canvas || !imageReady || !image) {
        return;
      }

      const ratio = window.devicePixelRatio || 1;
      const backingWidth = Math.round(canvasSize * ratio);
      const backingHeight = Math.round(canvasSize * ratio);
      if (canvasBackingRef.current.width !== backingWidth) {
        canvas.width = backingWidth;
        canvasBackingRef.current.width = backingWidth;
      }
      if (canvasBackingRef.current.height !== backingHeight) {
        canvas.height = backingHeight;
        canvasBackingRef.current.height = backingHeight;
      }
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
        previewTicks: previewDeltaTicks
      });
      context.restore();
    },
    [affectedRings, canvasSize, imageReady, previewDeltaTicks, q, resolvedRadii, selectedRing]
  );

  useEffect(() => {
    drawOffsetsRef.current = drawOffsets;
  }, [drawOffsets]);

  const stopSettlingFrame = useCallback(() => {
    settleRunRef.current += 1;
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (settleTimeoutRef.current !== null) {
      window.clearTimeout(settleTimeoutRef.current);
      settleTimeoutRef.current = null;
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

  const flashSettlingPhase = useCallback(() => {
    if (settleTimeoutRef.current !== null) {
      window.clearTimeout(settleTimeoutRef.current);
    }

    setAnimationPhase("settling");
    settleTimeoutRef.current = window.setTimeout(() => {
      settleTimeoutRef.current = null;
      setAnimationPhase("idle");
    }, SETTLE_ROTATION_MS);
  }, []);

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
    if (selectedRing !== null) {
      drawOffsets(
        previewDeltaTicks === 0
          ? previewBaseOffsetsRef.current ?? displayOffsetsRef.current
          : previewOffsetsFor(selectedRing, previewDeltaTicks)
      );
      return;
    }

    if (animationPhase !== "settling") {
      drawOffsets(displayOffsetsRef.current);
    }
  }, [animationPhase, drawOffsets, previewDeltaTicks, previewOffsetsFor, selectedRing]);

  useEffect(() => {
    const targetOffsets = [...offsets];
    if (selectedRing !== null) {
      return;
    }

    if (offsetsEqual(displayOffsetsRef.current, targetOffsets)) {
      if (animationPhase === "settling") {
        return;
      }
      cancelSettlingAnimation();
      return;
    }

    if (prefersReducedMotion()) {
      cancelSettlingAnimation(targetOffsets);
      return;
    }

    stopSettlingFrame();

    const startOffsets = [...displayOffsetsRef.current];
    const startTime = window.performance.now();
    const runId = settleRunRef.current + 1;
    settleRunRef.current = runId;
    setAnimationPhase("settling");

    const settle = (time: number) => {
      if (runId !== settleRunRef.current) {
        return;
      }

      const progress = Math.min((time - startTime) / SETTLE_ROTATION_MS, 1);
      const nextOffsets = interpolateOffsets(startOffsets, targetOffsets, q, progress);
      displayOffsetsRef.current = nextOffsets;
      drawOffsetsRef.current(nextOffsets);

      if (progress < 1) {
        animationFrameRef.current = window.requestAnimationFrame(settle);
        return;
      }

      if (runId !== settleRunRef.current) {
        return;
      }

      animationFrameRef.current = null;
      displayOffsetsRef.current = targetOffsets;
      drawOffsetsRef.current(targetOffsets);
      setAnimationPhase("idle");
    };

    animationFrameRef.current = window.requestAnimationFrame(settle);
  }, [animationPhase, cancelSettlingAnimation, offsets, q, selectedRing, stopSettlingFrame]);

  useEffect(() => () => stopSettlingFrame(), [stopSettlingFrame]);

  const cancelDrag = useCallback(() => {
    if (!dragRef.current) {
      return;
    }
    dragRef.current = null;
    if (previewBaseOffsetsRef.current) {
      displayOffsetsRef.current = [...previewBaseOffsetsRef.current];
      previewBaseOffsetsRef.current = null;
    }
    setSelectedRing(null);
    setPreviewTicks(0);
    setPreviewDeltaTicks(0);
    onCancel?.();
  }, [onCancel]);

  useEffect(() => {
    if (inputDisabled) {
      cancelDrag();
    }
  }, [cancelDrag, inputDisabled]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (inputDisabled || !canvasRef.current) {
      return;
    }

    const dragCanvasSize = canvasSize;
    const point = eventPoint(event.nativeEvent, canvasRef.current, dragCanvasSize);
    const session = beginPointerDrag({
      ...point,
      cx: dragCanvasSize / 2,
      cy: dragCanvasSize / 2,
      ringRadii: resolvedRadii,
      q
    });

    if (!session) {
      return;
    }

    cancelSettlingAnimation();
    previewBaseOffsetsRef.current = [...displayOffsetsRef.current];
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { ...session, canvasSize: dragCanvasSize, pointerId: event.pointerId };
    setSelectedRing(session.controlRing);
    setPreviewTicks(0);
    setPreviewDeltaTicks(0);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const session = dragRef.current;
    if (!session || session.pointerId !== event.pointerId || !canvasRef.current) {
      return;
    }

    const point = eventPoint(event.nativeEvent, canvasRef.current, session.canvasSize);
    const ticks = updatePointerDrag(session, {
      ...point,
      cx: session.canvasSize / 2,
      cy: session.canvasSize / 2
    });
    const visualTicks = session.previewDeltaTicks;
    const affected = computeAffectedRings(matrix, session.controlRing, q);
    const previewOffsets = previewOffsetsFor(session.controlRing, visualTicks);
    setPreviewTicks(ticks);
    setPreviewDeltaTicks(visualTicks);
    onPreview?.({
      controlRing: session.controlRing,
      deltaTicks: ticks,
      affectedRings: affected,
      previewOffsets,
      previewDeltaTicks: visualTicks
    });
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const session = dragRef.current;
    if (!session || session.pointerId !== event.pointerId) {
      return;
    }

    const committedMove = finishPointerDrag(session);
    const previewBaseOffsets = previewBaseOffsetsRef.current ?? displayOffsetsRef.current;
    dragRef.current = null;
    displayOffsetsRef.current = committedMove
      ? computeImagePreviewOffsets(previewBaseOffsets, matrix, session.controlRing, committedMove.deltaTicks, q)
      : [...previewBaseOffsets];
    previewBaseOffsetsRef.current = null;
    setSelectedRing(null);
    setPreviewTicks(0);
    setPreviewDeltaTicks(0);

    if (committedMove) {
      flashSettlingPhase();
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
      data-preview-delta-ticks={previewDeltaTicks}
      data-affected-rings={affectedRings.join(",")}
      data-offsets={offsets.join(",")}
      data-ring-count={offsets.length}
      data-ticks={q}
      data-animation-phase={animationPhase}
    >
      <canvas
        ref={canvasRef}
        className="puzzle-canvas"
        data-testid="puzzle-canvas"
        data-ring-count={offsets.length}
        data-ticks={q}
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

function eventPoint(event: PointerEvent, canvas: HTMLCanvasElement, canvasSize: number): { px: number; py: number } {
  const bounds = canvas.getBoundingClientRect();
  const scaleX = bounds.width > 0 ? canvasSize / bounds.width : 1;
  const scaleY = bounds.height > 0 ? canvasSize / bounds.height : scaleX;
  return {
    px: (event.clientX - bounds.left) * scaleX,
    py: (event.clientY - bounds.top) * scaleY
  };
}
