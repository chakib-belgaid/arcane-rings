import { useEffect, useRef } from "react";
import type { Level, RuntimeState } from "../../types/game";

type PlaceholderPuzzleCanvasProps = {
  level: Level;
  runtimeState: RuntimeState;
};

export function PlaceholderPuzzleCanvas({ level, runtimeState }: PlaceholderPuzzleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver(() => drawPlaceholderPuzzle(canvas, level, runtimeState));
    resizeObserver.observe(canvas);
    drawPlaceholderPuzzle(canvas, level, runtimeState);

    return () => resizeObserver.disconnect();
  }, [level, runtimeState]);

  return (
    <div className="puzzle-frame" data-testid="puzzle-frame">
      <canvas
        ref={canvasRef}
        aria-label="Seeded circular image puzzle placeholder"
        data-testid="puzzle-canvas"
      />
    </div>
  );
}

function drawPlaceholderPuzzle(canvas: HTMLCanvasElement, level: Level, runtimeState: RuntimeState) {
  const parent = canvas.parentElement;
  const rect = parent?.getBoundingClientRect();
  const cssSize = Math.max(280, Math.floor(Math.min(rect?.width ?? 420, rect?.height ?? 420)));
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = cssSize * dpr;
  canvas.height = cssSize * dpr;
  canvas.style.width = `${cssSize}px`;
  canvas.style.height = `${cssSize}px`;

  const context = canvas.getContext("2d");
  if (!context) return;

  context.scale(dpr, dpr);
  const center = cssSize / 2;
  const outerRadius = cssSize * 0.47;
  const imageSize = outerRadius * 2;

  context.clearRect(0, 0, cssSize, cssSize);
  drawBackdrop(context, center, outerRadius);

  for (let ring = level.n - 1; ring >= 0; ring -= 1) {
    const innerRadius = level.ringRadii[ring] * outerRadius;
    const outerRingRadius = level.ringRadii[ring + 1] * outerRadius;
    const rotation = (runtimeState.currentOffsets[ring] / level.q) * Math.PI * 2;

    context.save();
    context.beginPath();
    context.arc(center, center, outerRingRadius, 0, Math.PI * 2);
    context.arc(center, center, innerRadius, 0, Math.PI * 2, true);
    context.clip("evenodd");
    context.translate(center, center);
    context.rotate(rotation);
    drawSeededImagePatch(context, -imageSize / 2, -imageSize / 2, imageSize);
    context.restore();

    context.beginPath();
    context.arc(center, center, outerRingRadius, 0, Math.PI * 2);
    context.strokeStyle = ring === runtimeState.selectedRing ? "rgba(212, 168, 93, 0.9)" : "rgba(214, 229, 245, 0.22)";
    context.lineWidth = ring === runtimeState.selectedRing ? 2.6 : 1.2;
    context.stroke();
  }

  context.beginPath();
  context.arc(center, center, outerRadius, 0, Math.PI * 2);
  context.strokeStyle = "rgba(143, 184, 216, 0.74)";
  context.lineWidth = 2;
  context.stroke();
}

function drawBackdrop(context: CanvasRenderingContext2D, center: number, radius: number) {
  const gradient = context.createRadialGradient(center, center, radius * 0.2, center, center, radius * 1.25);
  gradient.addColorStop(0, "rgba(143, 184, 216, 0.16)");
  gradient.addColorStop(0.56, "rgba(126, 110, 168, 0.11)");
  gradient.addColorStop(1, "rgba(11, 16, 24, 0)");
  context.fillStyle = gradient;
  context.beginPath();
  context.arc(center, center, radius * 1.2, 0, Math.PI * 2);
  context.fill();
}

function drawSeededImagePatch(context: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const sky = context.createLinearGradient(x, y, x, y + size);
  sky.addColorStop(0, "#243452");
  sky.addColorStop(0.42, "#6e7890");
  sky.addColorStop(0.43, "#b28b62");
  sky.addColorStop(1, "#1b2230");
  context.fillStyle = sky;
  context.fillRect(x, y, size, size);

  context.fillStyle = "rgba(234, 238, 245, 0.72)";
  context.beginPath();
  context.moveTo(x + size * 0.12, y + size * 0.56);
  context.lineTo(x + size * 0.34, y + size * 0.28);
  context.lineTo(x + size * 0.52, y + size * 0.58);
  context.closePath();
  context.fill();

  context.fillStyle = "rgba(20, 31, 44, 0.86)";
  context.beginPath();
  context.moveTo(x + size * 0.34, y + size * 0.62);
  context.lineTo(x + size * 0.64, y + size * 0.24);
  context.lineTo(x + size * 0.92, y + size * 0.65);
  context.closePath();
  context.fill();

  context.strokeStyle = "rgba(212, 168, 93, 0.72)";
  context.lineWidth = size * 0.018;
  context.beginPath();
  context.moveTo(x + size * 0.08, y + size * 0.76);
  context.bezierCurveTo(x + size * 0.28, y + size * 0.64, x + size * 0.5, y + size * 0.82, x + size * 0.95, y + size * 0.69);
  context.stroke();
}
