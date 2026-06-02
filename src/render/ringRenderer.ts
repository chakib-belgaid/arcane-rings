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
    height: candidate.naturalHeight ?? candidate.videoHeight ?? Number(candidate.height),
  };
}

function addAnnulusPath(
  context: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
): void {
  context.beginPath();
  context.arc(cx, cy, outerRadius, 0, Math.PI * 2, false);
  if (innerRadius > 0) {
    context.arc(cx, cy, innerRadius, Math.PI * 2, 0, true);
  }
}

function strokeAnnulus(
  context: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
  color: string,
  lineWidth: number,
): void {
  context.save();
  context.strokeStyle = color;
  context.lineWidth = lineWidth;
  context.beginPath();
  context.arc(cx, cy, outerRadius, 0, Math.PI * 2);
  context.stroke();
  if (innerRadius > 0) {
    context.beginPath();
    context.arc(cx, cy, innerRadius, 0, Math.PI * 2);
    context.stroke();
  }
  context.restore();
}

function fillAnnulus(
  context: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
  color: string,
): void {
  context.save();
  addAnnulusPath(context, cx, cy, innerRadius, outerRadius);
  context.fillStyle = color;
  context.fill();
  context.restore();
}

export function drawPuzzleRings(
  context: CanvasRenderingContext2D,
  params: PuzzleRingRenderParams,
): void {
  const { image, width, height, ringRadii, offsets, q, selectedRing, affectedRings, previewTicks } =
    params;
  const cx = width / 2;
  const cy = height / 2;
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
    addAnnulusPath(context, cx, cy, innerRadius, outerRadius);
    context.clip();
    context.translate(cx, cy);
    context.rotate(rotation);
    context.drawImage(image, cropX, cropY, cropSide, cropSide, -radius, -radius, radius * 2, radius * 2);
    context.restore();
  }

  for (let ring = 0; ring < ringRadii.length - 1; ring += 1) {
    strokeAnnulus(
      context,
      cx,
      cy,
      ringRadii[ring],
      ringRadii[ring + 1],
      "rgba(181, 213, 232, 0.46)",
      1.4,
    );
  }

  for (const ring of affectedRings) {
    if (ring === selectedRing || ring < 0 || ring >= ringRadii.length - 1) {
      continue;
    }
    fillAnnulus(
      context,
      cx,
      cy,
      ringRadii[ring],
      ringRadii[ring + 1],
      "rgba(105, 174, 224, 0.13)",
    );
    strokeAnnulus(
      context,
      cx,
      cy,
      ringRadii[ring],
      ringRadii[ring + 1],
      "rgba(126, 197, 244, 0.7)",
      previewTicks === 0 ? 1.8 : 2.4,
    );
  }

  if (selectedRing !== null && selectedRing >= 0 && selectedRing < ringRadii.length - 1) {
    fillAnnulus(
      context,
      cx,
      cy,
      ringRadii[selectedRing],
      ringRadii[selectedRing + 1],
      "rgba(224, 173, 86, 0.15)",
    );
    strokeAnnulus(
      context,
      cx,
      cy,
      ringRadii[selectedRing],
      ringRadii[selectedRing + 1],
      "rgba(247, 192, 94, 0.95)",
      3,
    );
  }

  if (previewTicks !== 0 && selectedRing !== null) {
    const previewRingRadius = (ringRadii[selectedRing] + ringRadii[selectedRing + 1]) / 2;
    const arcLength = Math.min(Math.abs(previewTicks) / q, 0.5) * Math.PI * 2;
    const startAngle = previewTicks > 0 ? -Math.PI / 2 : -Math.PI / 2 - arcLength;
    const endAngle = previewTicks > 0 ? startAngle + arcLength : -Math.PI / 2;

    context.save();
    context.strokeStyle = "rgba(247, 192, 94, 0.95)";
    context.lineWidth = 5;
    context.lineCap = "round";
    context.beginPath();
    context.arc(cx, cy, previewRingRadius, startAngle, endAngle);
    context.stroke();
    context.restore();
  }
}
