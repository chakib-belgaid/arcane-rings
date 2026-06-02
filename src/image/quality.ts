import { assertImage, cropCenterSquare, getPixel, resizeNearestNeighbor, type RgbaImage } from "./preprocess";
import { balancedRingRadii } from "./ringMasks";

export const IMAGE_QUALITY_DEFAULTS = {
  maxRingSymmetrySimilarity: 0.92,
  symmetryRotationSteps: 12,
  symmetrySampleStride: 3,
  boundaryAngularSamples: 96,
  boundarySampleInsetPixels: 1,
  minBoundaryEdgeScore: 0.18,
  minStrongBoundaryFraction: 0.5,
  fairnessAnalysisSize: 128,
} as const;

export type RingSymmetryScore = {
  ringIndex: number;
  maxSimilarity: number;
  mostSimilarRotationStep: number;
  sampleCount: number;
};

export type RingSymmetryReport = {
  passes: boolean;
  maxSimilarity: number;
  threshold: number;
  ringScores: RingSymmetryScore[];
};

export type RingSymmetryOptions = {
  maxSimilarity?: number;
  rotationSteps?: number;
  sampleStride?: number;
};

export type BoundaryEdgeScore = {
  boundaryIndex: number;
  radius: number;
  score: number;
  sampleCount: number;
  strong: boolean;
};

export type CrossRingEdgeReport = {
  passes: boolean;
  minBoundaryEdgeScore: number;
  minStrongBoundaryFraction: number;
  strongBoundaryCount: number;
  boundaryScores: BoundaryEdgeScore[];
};

export type CrossRingEdgeOptions = {
  angularSamples?: number;
  sampleInsetPixels?: number;
  minBoundaryEdgeScore?: number;
  minStrongBoundaryFraction?: number;
};

export type ImageFairnessOptions = RingSymmetryOptions & CrossRingEdgeOptions & {
  ringCount: number;
  analysisSize?: number;
  radiiPower?: number;
};

export type ImageFairnessReport = {
  passes: boolean;
  ringCount: number;
  radii: number[];
  symmetry: RingSymmetryReport;
  edges: CrossRingEdgeReport;
};

export function scoreRingSymmetry(image: RgbaImage, radii: number[], options: RingSymmetryOptions = {}): RingSymmetryReport {
  assertImage(image);
  assertRadii(radii);

  const threshold = options.maxSimilarity ?? IMAGE_QUALITY_DEFAULTS.maxRingSymmetrySimilarity;
  const rotationSteps = options.rotationSteps ?? IMAGE_QUALITY_DEFAULTS.symmetryRotationSteps;
  const sampleStride = options.sampleStride ?? IMAGE_QUALITY_DEFAULTS.symmetrySampleStride;
  const centerX = (image.width - 1) / 2;
  const centerY = (image.height - 1) / 2;

  const ringScores: RingSymmetryScore[] = [];

  for (let ringIndex = 0; ringIndex < radii.length - 1; ringIndex += 1) {
    let maxSimilarity = 0;
    let mostSimilarRotationStep = 0;
    let bestSampleCount = 0;

    for (let rotationStep = 1; rotationStep < rotationSteps; rotationStep += 1) {
      const angle = (Math.PI * 2 * rotationStep) / rotationSteps;
      const similarity = rotatedRingSimilarity(image, centerX, centerY, radii[ringIndex], radii[ringIndex + 1], angle, sampleStride);
      if (similarity.value > maxSimilarity) {
        maxSimilarity = similarity.value;
        mostSimilarRotationStep = rotationStep;
        bestSampleCount = similarity.sampleCount;
      }
    }

    ringScores.push({
      ringIndex,
      maxSimilarity,
      mostSimilarRotationStep,
      sampleCount: bestSampleCount,
    });
  }

  const maxSimilarity = Math.max(...ringScores.map((score) => score.maxSimilarity));

  return {
    passes: maxSimilarity <= threshold,
    maxSimilarity,
    threshold,
    ringScores,
  };
}

export function scoreCrossRingEdges(image: RgbaImage, radii: number[], options: CrossRingEdgeOptions = {}): CrossRingEdgeReport {
  assertImage(image);
  assertRadii(radii);

  const angularSamples = options.angularSamples ?? IMAGE_QUALITY_DEFAULTS.boundaryAngularSamples;
  const sampleInsetPixels = options.sampleInsetPixels ?? IMAGE_QUALITY_DEFAULTS.boundarySampleInsetPixels;
  const minBoundaryEdgeScore = options.minBoundaryEdgeScore ?? IMAGE_QUALITY_DEFAULTS.minBoundaryEdgeScore;
  const minStrongBoundaryFraction = options.minStrongBoundaryFraction ?? IMAGE_QUALITY_DEFAULTS.minStrongBoundaryFraction;
  const centerX = (image.width - 1) / 2;
  const centerY = (image.height - 1) / 2;

  const boundaryScores: BoundaryEdgeScore[] = [];

  for (let boundaryIndex = 1; boundaryIndex < radii.length - 1; boundaryIndex += 1) {
    const radius = radii[boundaryIndex];
    const differences: number[] = [];

    for (let sampleIndex = 0; sampleIndex < angularSamples; sampleIndex += 1) {
      const angle = (Math.PI * 2 * sampleIndex) / angularSamples;
      const inner = sampleAtPolar(image, centerX, centerY, Math.max(0, radius - sampleInsetPixels), angle);
      const outer = sampleAtPolar(image, centerX, centerY, radius + sampleInsetPixels, angle);
      const boundaryX = centerX + Math.cos(angle) * radius;
      const boundaryY = centerY + Math.sin(angle) * radius;
      differences.push(Math.max(colorDistance(inner, outer), localGradientMagnitude(image, boundaryX, boundaryY, sampleInsetPixels)));
    }

    differences.sort((a, b) => b - a);
    const topCount = Math.max(1, Math.ceil(differences.length * 0.2));
    const score = mean(differences.slice(0, topCount));

    boundaryScores.push({
      boundaryIndex: boundaryIndex - 1,
      radius,
      score,
      sampleCount: differences.length,
      strong: score >= minBoundaryEdgeScore,
    });
  }

  const strongBoundaryCount = boundaryScores.filter((score) => score.strong).length;
  const requiredStrongBoundaryCount = Math.ceil(boundaryScores.length * minStrongBoundaryFraction);

  return {
    passes: boundaryScores.length > 0 && strongBoundaryCount >= requiredStrongBoundaryCount,
    minBoundaryEdgeScore,
    minStrongBoundaryFraction,
    strongBoundaryCount,
    boundaryScores,
  };
}

export function evaluateImageFairness(image: RgbaImage, options: ImageFairnessOptions): ImageFairnessReport {
  assertImage(image);

  const analysisSize = options.analysisSize ?? IMAGE_QUALITY_DEFAULTS.fairnessAnalysisSize;
  const cropped = cropCenterSquare(image);
  const analysisImage = cropped.width === analysisSize && cropped.height === analysisSize
    ? cropped
    : resizeNearestNeighbor(cropped, analysisSize, analysisSize);
  const radii = balancedRingRadii(analysisSize / 2, options.ringCount, options.radiiPower);
  const symmetry = scoreRingSymmetry(analysisImage, radii, options);
  const edges = scoreCrossRingEdges(analysisImage, radii, options);

  return {
    passes: symmetry.passes && edges.passes,
    ringCount: options.ringCount,
    radii,
    symmetry,
    edges,
  };
}

function rotatedRingSimilarity(
  image: RgbaImage,
  centerX: number,
  centerY: number,
  innerRadius: number,
  outerRadius: number,
  angle: number,
  sampleStride: number,
): { value: number; sampleCount: number } {
  let totalDistance = 0;
  let sampleCount = 0;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  for (let y = 0; y < image.height; y += sampleStride) {
    for (let x = 0; x < image.width; x += sampleStride) {
      const dx = x - centerX;
      const dy = y - centerY;
      const radius = Math.hypot(dx, dy);

      if (radius < innerRadius || radius >= outerRadius) {
        continue;
      }

      const rotatedX = centerX + dx * cos - dy * sin;
      const rotatedY = centerY + dx * sin + dy * cos;
      const rotatedRadius = Math.hypot(rotatedX - centerX, rotatedY - centerY);

      if (rotatedRadius < innerRadius || rotatedRadius >= outerRadius) {
        continue;
      }

      totalDistance += colorDistance(getPixel(image, x, y), getPixel(image, rotatedX, rotatedY));
      sampleCount += 1;
    }
  }

  if (sampleCount === 0) {
    return { value: 0, sampleCount };
  }

  return {
    value: 1 - totalDistance / sampleCount,
    sampleCount,
  };
}

function sampleAtPolar(image: RgbaImage, centerX: number, centerY: number, radius: number, angle: number): [number, number, number, number] {
  return getPixel(image, centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius);
}

function localGradientMagnitude(image: RgbaImage, x: number, y: number, step: number): number {
  const horizontal = colorDistance(getPixel(image, x - step, y), getPixel(image, x + step, y));
  const vertical = colorDistance(getPixel(image, x, y - step), getPixel(image, x, y + step));

  return Math.sqrt(horizontal ** 2 + vertical ** 2) / Math.SQRT2;
}

function colorDistance(left: [number, number, number, number], right: [number, number, number, number]): number {
  const red = left[0] - right[0];
  const green = left[1] - right[1];
  const blue = left[2] - right[2];

  return Math.sqrt(red ** 2 + green ** 2 + blue ** 2) / Math.sqrt(3 * 255 ** 2);
}

function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function assertRadii(radii: number[]): void {
  if (radii.length < 2) {
    throw new Error("radii must include at least an inner and outer radius");
  }

  for (let index = 0; index < radii.length; index += 1) {
    if (!Number.isFinite(radii[index]) || radii[index] < 0) {
      throw new Error("radii values must be non-negative finite numbers");
    }

    if (index > 0 && radii[index] <= radii[index - 1]) {
      throw new Error("radii values must be strictly increasing");
    }
  }
}
