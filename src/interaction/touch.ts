export function findRingFromPoint(
  px: number,
  py: number,
  cx: number,
  cy: number,
  ringRadii: number[]
): number | null {
  const dx = px - cx;
  const dy = py - cy;
  const radius = Math.sqrt(dx * dx + dy * dy);

  for (let i = 0; i < ringRadii.length - 1; i += 1) {
    if ((ringRadii[i] ?? 0) <= radius && radius < (ringRadii[i + 1] ?? 0)) {
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
