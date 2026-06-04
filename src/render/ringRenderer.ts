import type { Level } from "../game/types";

export type RingRenderState = {
  offsets: number[];
  selectedRing: number | null;
  affectedRings: number[];
  highlightedRing: number | null;
  solved: boolean;
  highContrast: boolean;
};

export type PuzzleGeometry = {
  centerX: number;
  centerY: number;
  radius: number;
};

export function drawPuzzle(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  level: Level,
  state: RingRenderState
): PuzzleGeometry {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context is unavailable.");
  }

  const width = canvas.width;
  const height = canvas.height;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.455;

  ctx.clearRect(0, 0, width, height);
  drawBackdrop(ctx, centerX, centerY, radius, state.solved);

  let previousRadius = 0;
  level.ringRadii.forEach((ratio, index) => {
    const outer = radius * ratio;
    const inner = radius * previousRadius;
    const angle = (state.offsets[index] / level.q) * Math.PI * 2;

    ctx.save();
    annulusPath(ctx, centerX, centerY, inner, outer);
    ctx.clip("evenodd");
    ctx.translate(centerX, centerY);
    ctx.rotate(angle);
    ctx.drawImage(image, -radius, -radius, radius * 2, radius * 2);
    ctx.restore();

    previousRadius = ratio;
  });

  drawRingBorders(ctx, level, centerX, centerY, radius, state);
  drawCardinalVines(ctx, centerX, centerY, radius, state.solved);

  return { centerX, centerY, radius };
}

function drawBackdrop(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  solved: boolean
) {
  const glow = ctx.createRadialGradient(centerX, centerY, radius * 0.2, centerX, centerY, radius * 1.32);
  glow.addColorStop(0, solved ? "rgba(244, 214, 131, 0.22)" : "rgba(111, 188, 184, 0.12)");
  glow.addColorStop(0.72, "rgba(6, 22, 17, 0.3)");
  glow.addColorStop(1, "rgba(1, 8, 7, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 1.35, 0, Math.PI * 2);
  ctx.fill();
}

function drawRingBorders(
  ctx: CanvasRenderingContext2D,
  level: Level,
  centerX: number,
  centerY: number,
  radius: number,
  state: RingRenderState
) {
  ctx.save();
  ctx.lineCap = "round";

  level.ringRadii.forEach((ratio, index) => {
    const ringRadius = radius * ratio;
    const isSelected = state.selectedRing === index;
    const isAffected = state.affectedRings.includes(index);
    const isHinted = state.highlightedRing === index;

    ctx.shadowBlur = isSelected || isHinted ? 22 : isAffected ? 14 : 0;
    ctx.shadowColor = isSelected || isHinted ? "rgba(244, 214, 131, 0.9)" : "rgba(135, 217, 191, 0.55)";
    ctx.strokeStyle = isSelected
      ? "#f4d683"
      : isHinted
        ? "#fff2b4"
        : isAffected
          ? "#8bd7bf"
          : state.highContrast
            ? "#f7ead2"
            : "rgba(224, 198, 132, 0.78)";
    ctx.lineWidth = isSelected || isHinted ? 5 : isAffected ? 3.5 : 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
    ctx.stroke();
  });

  ctx.shadowBlur = 18;
  ctx.shadowColor = "rgba(244, 214, 131, 0.55)";
  ctx.strokeStyle = state.solved ? "#ffe8a3" : "rgba(244, 214, 131, 0.78)";
  ctx.lineWidth = state.solved ? 7 : 3;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawCardinalVines(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  solved: boolean
) {
  ctx.save();
  ctx.strokeStyle = solved ? "rgba(255, 232, 163, 0.76)" : "rgba(174, 216, 157, 0.5)";
  ctx.fillStyle = solved ? "rgba(255, 232, 163, 0.9)" : "rgba(174, 216, 157, 0.72)";
  ctx.lineWidth = 2;

  for (let index = 0; index < 4; index += 1) {
    const angle = index * (Math.PI / 2) - Math.PI / 2;
    const inner = radius * 1.01;
    const outer = radius * 1.09;
    const x1 = centerX + Math.cos(angle) * inner;
    const y1 = centerY + Math.sin(angle) * inner;
    const x2 = centerX + Math.cos(angle) * outer;
    const y2 = centerY + Math.sin(angle) * outer;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(x2, y2, 4, 8, angle, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function annulusPath(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  inner: number,
  outer: number
) {
  ctx.beginPath();
  ctx.arc(centerX, centerY, outer, 0, Math.PI * 2);
  if (inner > 0) {
    ctx.arc(centerX, centerY, inner, Math.PI * 2, 0, true);
  }
}
