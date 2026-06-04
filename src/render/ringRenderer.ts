import type { Level } from "../game/types";

export type RingRenderState = {
  offsets: number[];
  selectedRing: number | null;
  affectedRings: number[];
  highlightedRing: number | null;
  solved: boolean;
  highContrast: boolean;
  effects?: RingEffectFrame;
};

export type PuzzleGeometry = {
  centerX: number;
  centerY: number;
  radius: number;
};

export type RingEffectFrame = {
  nowMs: number;
  reducedMotion: boolean;
  commitBurst?: RingBurst | null;
  dragRing?: number | null;
};

export type RingBurst = {
  ring: number;
  startedAtMs: number;
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
  drawRingEffects(ctx, level, centerX, centerY, radius, state);
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

function drawRingEffects(
  ctx: CanvasRenderingContext2D,
  level: Level,
  centerX: number,
  centerY: number,
  radius: number,
  state: RingRenderState
) {
  const frame = state.effects;
  if (!frame) {
    return;
  }

  drawSelectionGlints(ctx, level, centerX, centerY, radius, state, frame);
  drawHintShimmer(ctx, level, centerX, centerY, radius, state.highlightedRing, frame);
  drawCommitBurst(ctx, level, centerX, centerY, radius, frame);
  drawSolvedPulse(ctx, centerX, centerY, radius, state.solved, frame);
}

function drawSelectionGlints(
  ctx: CanvasRenderingContext2D,
  level: Level,
  centerX: number,
  centerY: number,
  radius: number,
  state: RingRenderState,
  frame: RingEffectFrame
) {
  const activeRings = new Set<number>();
  if (state.selectedRing !== null) {
    activeRings.add(state.selectedRing);
  }
  if (frame.dragRing !== null && frame.dragRing !== undefined) {
    activeRings.add(frame.dragRing);
  }
  state.affectedRings.forEach((ring) => activeRings.add(ring));

  if (activeRings.size === 0) {
    return;
  }

  const sweepStart = frame.reducedMotion ? -Math.PI / 2 : (frame.nowMs / 900) % (Math.PI * 2);

  ctx.save();
  ctx.lineCap = "round";
  activeRings.forEach((ring) => {
    const bounds = ringBounds(level, radius, ring);
    if (!bounds) {
      return;
    }

    const isSelected = ring === state.selectedRing || ring === frame.dragRing;
    const alpha = isSelected ? 0.78 : 0.42;
    const arcLength = isSelected ? Math.PI * 0.34 : Math.PI * 0.22;
    ctx.globalAlpha = alpha;
    ctx.shadowBlur = isSelected ? 18 : 10;
    ctx.shadowColor = isSelected ? "rgba(255, 232, 163, 0.82)" : "rgba(143, 201, 214, 0.56)";
    ctx.strokeStyle = isSelected ? "rgba(255, 232, 163, 0.92)" : "rgba(143, 201, 214, 0.72)";
    ctx.lineWidth = isSelected ? 3.4 : 2.2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, bounds.mid, sweepStart + ring * 0.58, sweepStart + ring * 0.58 + arcLength);
    ctx.stroke();
  });
  ctx.restore();
}

function drawHintShimmer(
  ctx: CanvasRenderingContext2D,
  level: Level,
  centerX: number,
  centerY: number,
  radius: number,
  highlightedRing: number | null,
  frame: RingEffectFrame
) {
  if (highlightedRing === null) {
    return;
  }

  const bounds = ringBounds(level, radius, highlightedRing);
  if (!bounds) {
    return;
  }

  const shimmer = frame.reducedMotion ? 0.72 : 0.52 + Math.sin(frame.nowMs / 130) * 0.2;
  const start = frame.reducedMotion ? Math.PI * 0.85 : (frame.nowMs / 620) % (Math.PI * 2);

  ctx.save();
  ctx.globalAlpha = shimmer;
  ctx.lineCap = "round";
  ctx.shadowBlur = 20;
  ctx.shadowColor = "rgba(255, 242, 180, 0.88)";
  ctx.strokeStyle = "rgba(255, 242, 180, 0.9)";
  ctx.lineWidth = 3;
  for (let index = 0; index < 3; index += 1) {
    const offset = start + index * ((Math.PI * 2) / 3);
    ctx.beginPath();
    ctx.arc(centerX, centerY, bounds.outer, offset, offset + Math.PI * 0.16);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCommitBurst(
  ctx: CanvasRenderingContext2D,
  level: Level,
  centerX: number,
  centerY: number,
  radius: number,
  frame: RingEffectFrame
) {
  const burst = frame.commitBurst;
  if (!burst) {
    return;
  }

  const bounds = ringBounds(level, radius, burst.ring);
  if (!bounds) {
    return;
  }

  const duration = 560;
  const rawProgress = frame.reducedMotion ? 0.62 : (frame.nowMs - burst.startedAtMs) / duration;
  const progress = clamp(rawProgress, 0, 1);
  const alpha = frame.reducedMotion ? 0.34 : Math.max(0, 1 - progress);
  if (alpha <= 0) {
    return;
  }

  const burstRadius = bounds.mid + progress * radius * 0.085;
  const sparkleRadius = bounds.mid + progress * radius * 0.05;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineCap = "round";
  ctx.shadowBlur = 24;
  ctx.shadowColor = "rgba(255, 232, 163, 0.9)";
  ctx.strokeStyle = "rgba(255, 232, 163, 0.88)";
  ctx.lineWidth = 3.6 - progress * 1.7;
  ctx.beginPath();
  ctx.arc(centerX, centerY, burstRadius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "rgba(255, 242, 180, 0.95)";
  for (let index = 0; index < 8; index += 1) {
    const angle = index * (Math.PI / 4) + burst.ring * 0.31 + progress * 0.45;
    const x = centerX + Math.cos(angle) * sparkleRadius;
    const y = centerY + Math.sin(angle) * sparkleRadius;
    ctx.beginPath();
    ctx.ellipse(x, y, 2.2, 4.8, angle, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawSolvedPulse(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  solved: boolean,
  frame: RingEffectFrame
) {
  if (!solved) {
    return;
  }

  const loop = frame.reducedMotion ? 0.4 : (frame.nowMs % 1_100) / 1_100;
  const pulseRadius = radius * (1.04 + loop * 0.1);
  const alpha = frame.reducedMotion ? 0.38 : 0.46 * (1 - loop);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.shadowBlur = 30;
  ctx.shadowColor = "rgba(255, 232, 163, 0.88)";
  ctx.strokeStyle = "rgba(255, 232, 163, 0.82)";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
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

function ringBounds(level: Level, radius: number, ring: number): { inner: number; outer: number; mid: number } | null {
  const outerRatio = level.ringRadii[ring];
  if (outerRatio === undefined) {
    return null;
  }

  const inner = radius * (level.ringRadii[ring - 1] ?? 0);
  const outer = radius * outerRatio;
  return { inner, outer, mid: (inner + outer) / 2 };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
