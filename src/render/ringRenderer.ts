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

export type PuzzleRingRenderParams = {
  image: CanvasImageSource;
  width: number;
  height: number;
  ringRadii: number[];
  offsets: number[];
  q: number;
  selectedRing: number | null;
  affectedRings: number[];
  previewTicks: number;
};

type SourceDimensions = {
  width: number;
  height: number;
};

const DIMMED_RING_OVERLAY = "rgba(4, 8, 11, 0.34)";
const AFFECTED_RING_GLOW = {
  fill: "rgba(224, 173, 86, 0.14)",
  lineWidth: 4.6,
  shadowBlur: 17,
  shadowColor: "rgba(247, 192, 94, 0.78)",
  stroke: "rgba(247, 192, 94, 0.74)"
};
const SELECTED_RING_GLOW = {
  fill: "rgba(224, 173, 86, 0.2)",
  lineWidth: 5.8,
  shadowBlur: 24,
  shadowColor: "rgba(247, 192, 94, 0.78)",
  stroke: "rgba(247, 192, 94, 0.98)",
  strokeHot: "rgba(255, 238, 186, 0.9)"
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

export function drawPuzzleRings(
  context: CanvasRenderingContext2D,
  params: PuzzleRingRenderParams
): void {
  const { image, width, height, ringRadii, offsets, q, selectedRing, affectedRings, previewTicks } = params;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = ringRadii[ringRadii.length - 1] ?? Math.min(width, height) / 2;
  const dimensions = sourceDimensions(image);
  const cropSide = Math.min(dimensions.width, dimensions.height);
  const cropX = (dimensions.width - cropSide) / 2;
  const cropY = (dimensions.height - cropSide) / 2;

  context.clearRect(0, 0, width, height);
  context.fillStyle = "#081018";
  context.fillRect(0, 0, width, height);

  for (let ring = 0; ring < ringRadii.length - 1; ring += 1) {
    const innerRadius = ringRadii[ring];
    const outerRadius = ringRadii[ring + 1];
    const rotation = ((offsets[ring] ?? 0) * Math.PI * 2) / q;

    context.save();
    annulusPath(context, centerX, centerY, innerRadius, outerRadius);
    context.clip("evenodd");
    context.translate(centerX, centerY);
    context.rotate(rotation);
    context.drawImage(image, cropX, cropY, cropSide, cropSide, -radius, -radius, radius * 2, radius * 2);
    context.restore();
  }

  if (selectedRing !== null) {
    const highlightedRings = new Set([selectedRing, ...affectedRings]);
    for (let ring = 0; ring < ringRadii.length - 1; ring += 1) {
      if (!highlightedRings.has(ring)) {
        fillAnnulus(context, centerX, centerY, ringRadii[ring], ringRadii[ring + 1], DIMMED_RING_OVERLAY);
      }
    }
  }

  for (let ring = 0; ring < ringRadii.length - 1; ring += 1) {
    strokeAnnulus(context, centerX, centerY, ringRadii[ring], ringRadii[ring + 1], "rgba(181, 213, 232, 0.46)", 1.4);
  }

  for (const ring of affectedRings) {
    if (ring === selectedRing || ring < 0 || ring >= ringRadii.length - 1) {
      continue;
    }

    glowAnnulus(
      context,
      centerX,
      centerY,
      ringRadii[ring],
      ringRadii[ring + 1],
      AFFECTED_RING_GLOW.stroke,
      AFFECTED_RING_GLOW.shadowColor,
      previewTicks === 0 ? 3.4 : AFFECTED_RING_GLOW.lineWidth,
      previewTicks === 0 ? 13 : AFFECTED_RING_GLOW.shadowBlur
    );
    fillAnnulus(context, centerX, centerY, ringRadii[ring], ringRadii[ring + 1], AFFECTED_RING_GLOW.fill);
    strokeAnnulus(
      context,
      centerX,
      centerY,
      ringRadii[ring],
      ringRadii[ring + 1],
      AFFECTED_RING_GLOW.stroke,
      previewTicks === 0 ? 1.9 : 2.6
    );
  }

  if (selectedRing !== null && selectedRing >= 0 && selectedRing < ringRadii.length - 1) {
    glowAnnulus(
      context,
      centerX,
      centerY,
      ringRadii[selectedRing],
      ringRadii[selectedRing + 1],
      SELECTED_RING_GLOW.stroke,
      SELECTED_RING_GLOW.shadowColor,
      SELECTED_RING_GLOW.lineWidth,
      SELECTED_RING_GLOW.shadowBlur
    );
    fillAnnulus(
      context,
      centerX,
      centerY,
      ringRadii[selectedRing],
      ringRadii[selectedRing + 1],
      SELECTED_RING_GLOW.fill
    );
    strokeAnnulus(
      context,
      centerX,
      centerY,
      ringRadii[selectedRing],
      ringRadii[selectedRing + 1],
      SELECTED_RING_GLOW.stroke,
      3.4
    );
    strokeAnnulus(
      context,
      centerX,
      centerY,
      ringRadii[selectedRing],
      ringRadii[selectedRing + 1],
      SELECTED_RING_GLOW.strokeHot,
      1.2
    );
  }

  if (previewTicks !== 0 && selectedRing !== null) {
    const previewRingRadius = (ringRadii[selectedRing] + ringRadii[selectedRing + 1]) / 2;
    const arcLength = Math.min(Math.abs(previewTicks) / q, 0.5) * Math.PI * 2;
    const startAngle = previewTicks > 0 ? -Math.PI / 2 : -Math.PI / 2 - arcLength;
    const endAngle = previewTicks > 0 ? startAngle + arcLength : -Math.PI / 2;

    context.save();
    context.strokeStyle = "rgba(247, 192, 94, 0.95)";
    context.shadowBlur = 12;
    context.shadowColor = SELECTED_RING_GLOW.shadowColor;
    context.lineWidth = 5;
    context.lineCap = "round";
    context.beginPath();
    context.arc(centerX, centerY, previewRingRadius, startAngle, endAngle);
    context.stroke();
    context.restore();
  }
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
    const shouldDrawRing = isSelected || isAffected || isHinted || state.highContrast || state.solved;

    if (!shouldDrawRing) {
      return;
    }

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
            : "rgba(224, 198, 132, 0.48)";
    ctx.lineWidth = isSelected || isHinted ? 5 : isAffected ? 3.5 : state.highContrast ? 2.4 : 1.4;
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

function sourceDimensions(source: CanvasImageSource): SourceDimensions {
  const candidate = source as {
    naturalWidth?: number;
    naturalHeight?: number;
    videoWidth?: number;
    videoHeight?: number;
    width?: number;
    height?: number;
  };

  return {
    width: candidate.naturalWidth ?? candidate.videoWidth ?? Number(candidate.width),
    height: candidate.naturalHeight ?? candidate.videoHeight ?? Number(candidate.height)
  };
}

function strokeAnnulus(
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  innerRadius: number,
  outerRadius: number,
  color: string,
  lineWidth: number
): void {
  context.save();
  context.strokeStyle = color;
  context.lineWidth = lineWidth;
  context.beginPath();
  context.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
  context.stroke();
  if (innerRadius > 0) {
    context.beginPath();
    context.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
    context.stroke();
  }
  context.restore();
}

function glowAnnulus(
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  innerRadius: number,
  outerRadius: number,
  strokeColor: string,
  shadowColor: string,
  lineWidth: number,
  blur: number
): void {
  context.save();
  context.shadowColor = shadowColor;
  context.shadowBlur = blur;
  context.shadowOffsetX = 0;
  context.shadowOffsetY = 0;
  context.strokeStyle = strokeColor;
  context.lineWidth = lineWidth;
  context.beginPath();
  context.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
  context.stroke();
  if (innerRadius > 0) {
    context.beginPath();
    context.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
    context.stroke();
  }
  context.restore();
}

function fillAnnulus(
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  innerRadius: number,
  outerRadius: number,
  color: string
): void {
  context.save();
  annulusPath(context, centerX, centerY, innerRadius, outerRadius);
  context.fillStyle = color;
  context.fill("evenodd");
  context.restore();
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
