export type PointerDragSession = {
  controlRing: number;
  startAngle: number;
  q: number;
  previewTicks: number;
};

export type PointerPoint = {
  px: number;
  py: number;
  cx: number;
  cy: number;
};

export type BeginPointerDragInput = PointerPoint & {
  ringRadii: number[];
  q: number;
};

export function modNorm(value: number, q: number): number {
  return ((value % q) + q) % q;
}

export function findRingFromPoint(
  px: number,
  py: number,
  cx: number,
  cy: number,
  ringRadii: number[],
): number | null {
  const dx = px - cx;
  const dy = py - cy;
  const radius = Math.sqrt(dx * dx + dy * dy);

  for (let i = 0; i < ringRadii.length - 1; i += 1) {
    if (ringRadii[i] <= radius && radius < ringRadii[i + 1]) {
      return i;
    }
  }

  return null;
}

export function angleOfPoint(px: number, py: number, cx: number, cy: number): number {
  return Math.atan2(py - cy, px - cx);
}

export function unwrapAngleDelta(startAngle: number, currentAngle: number): number {
  let delta = currentAngle - startAngle;
  while (delta <= -Math.PI) delta += 2 * Math.PI;
  while (delta > Math.PI) delta -= 2 * Math.PI;
  return delta;
}

export function angleDeltaToTicks(deltaAngle: number, q: number): number {
  const tickAngle = (2 * Math.PI) / q;
  return Math.round(deltaAngle / tickAngle);
}

export function beginPointerDrag(input: BeginPointerDragInput): PointerDragSession | null {
  const controlRing = findRingFromPoint(
    input.px,
    input.py,
    input.cx,
    input.cy,
    input.ringRadii,
  );

  if (controlRing === null) {
    return null;
  }

  return {
    controlRing,
    startAngle: angleOfPoint(input.px, input.py, input.cx, input.cy),
    q: input.q,
    previewTicks: 0,
  };
}

export function updatePointerDrag(session: PointerDragSession, point: PointerPoint): number {
  const currentAngle = angleOfPoint(point.px, point.py, point.cx, point.cy);
  const deltaAngle = unwrapAngleDelta(session.startAngle, currentAngle);
  session.previewTicks = angleDeltaToTicks(deltaAngle, session.q);
  return session.previewTicks;
}

export function finishPointerDrag(
  session: PointerDragSession,
): { controlRing: number; deltaTicks: number } | null {
  if (session.previewTicks === 0) {
    return null;
  }

  return {
    controlRing: session.controlRing,
    deltaTicks: session.previewTicks,
  };
}

export function computeAffectedRings(
  matrix: number[][],
  controlRing: number | null,
  q: number,
): number[] {
  if (controlRing === null) {
    return [];
  }

  return matrix.reduce<number[]>((rings, row, ring) => {
    if (modNorm(row[controlRing] ?? 0, q) !== 0) {
      rings.push(ring);
    }
    return rings;
  }, []);
}

export function computePreviewOffsets(
  currentOffsets: number[],
  matrix: number[][],
  controlRing: number,
  previewTicks: number,
  q: number,
): number[] {
  return currentOffsets.map((offset, ring) =>
    modNorm(offset + (matrix[ring]?.[controlRing] ?? 0) * previewTicks, q),
  );
}
