import { describe, expect, test } from "bun:test";

import {
  IMAGE_QUALITY_DEFAULTS,
  balancedRingRadii,
  centerSquareCrop,
  cropCenterSquare,
  createRingMaskMetadata,
  evaluateImageFairness,
  resizeNearestNeighbor,
  scoreCrossRingEdges,
  scoreRingSymmetry,
  type RgbaImage,
} from "../src/image/index";

function rgbaImage(width: number, height: number, pixelAt: (x: number, y: number) => [number, number, number, number] = () => [0, 0, 0, 255]): RgbaImage {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const [r, g, b, a] = pixelAt(x, y);
      const offset = (y * width + x) * 4;
      data[offset] = r;
      data[offset + 1] = g;
      data[offset + 2] = b;
      data[offset + 3] = a;
    }
  }
  return { width, height, data };
}

function pixel(image: RgbaImage, x: number, y: number): [number, number, number, number] {
  const offset = (y * image.width + x) * 4;
  return [image.data[offset], image.data[offset + 1], image.data[offset + 2], image.data[offset + 3]];
}

function radialBandsImage(size: number, ringCount: number): RgbaImage {
  const radii = balancedRingRadii(size / 2, ringCount);
  const center = (size - 1) / 2;
  const palette: Array<[number, number, number, number]> = [
    [20, 20, 20, 255],
    [230, 230, 230, 255],
    [30, 140, 240, 255],
    [245, 180, 20, 255],
  ];

  return rgbaImage(size, size, (x, y) => {
    const distance = Math.hypot(x - center, y - center);
    const ringIndex = radii.findIndex((radius, index) => index > 0 && distance <= radius);
    return palette[Math.max(0, ringIndex) % palette.length];
  });
}

function diagonalFeatureImage(size: number): RgbaImage {
  return rgbaImage(size, size, (x, y) => {
    const diagonal = Math.abs(x - y) <= 1;
    const horizon = Math.abs(y - Math.floor(size * 0.62)) <= 1;
    if (diagonal || horizon) {
      return [245, 245, 245, 255];
    }

    return x > y ? [18, 70, 160, 255] : [180, 52, 44, 255];
  });
}

describe("image preprocessing", () => {
  test("centerSquareCrop returns the centered square for landscape, portrait, and square sources", () => {
    expect(centerSquareCrop(8, 4)).toEqual({ left: 2, top: 0, size: 4 });
    expect(centerSquareCrop(5, 9)).toEqual({ left: 0, top: 2, size: 5 });
    expect(centerSquareCrop(6, 6)).toEqual({ left: 0, top: 0, size: 6 });
  });

  test("cropCenterSquare copies the centered pixel data without mutating the source", () => {
    const source = rgbaImage(5, 3, (x, y) => [x, y, x + y, 255]);
    const cropped = cropCenterSquare(source);

    expect(cropped.width).toBe(3);
    expect(cropped.height).toBe(3);
    expect(pixel(cropped, 0, 0)).toEqual([1, 0, 1, 255]);
    expect(pixel(cropped, 2, 2)).toEqual([3, 2, 5, 255]);
    expect(pixel(source, 0, 0)).toEqual([0, 0, 0, 255]);
  });

  test("resizeNearestNeighbor maps corners deterministically", () => {
    const source = rgbaImage(2, 2, (x, y) => [x * 100, y * 100, 0, 255]);
    const resized = resizeNearestNeighbor(source, 4, 4);

    expect(resized.width).toBe(4);
    expect(resized.height).toBe(4);
    expect(pixel(resized, 0, 0)).toEqual([0, 0, 0, 255]);
    expect(pixel(resized, 3, 0)).toEqual([100, 0, 0, 255]);
    expect(pixel(resized, 0, 3)).toEqual([0, 100, 0, 255]);
    expect(pixel(resized, 3, 3)).toEqual([100, 100, 0, 255]);
  });
});

describe("ring metadata", () => {
  test("balancedRingRadii returns n + 1 monotonic radii from center to puzzle radius", () => {
    const radii = balancedRingRadii(120, 4);

    expect(radii).toHaveLength(5);
    expect(radii[0]).toBe(0);
    expect(radii[4]).toBe(120);
    for (let index = 1; index < radii.length; index += 1) {
      expect(radii[index]).toBeGreaterThan(radii[index - 1]);
    }
  });

  test("createRingMaskMetadata describes annulus bounds and approximate area balance", () => {
    const metadata = createRingMaskMetadata({ size: 120, ringCount: 3 });

    expect(metadata.rings).toHaveLength(3);
    expect(metadata.radii).toHaveLength(4);
    expect(metadata.rings[0]).toMatchObject({ index: 0, innerRadius: 0 });
    expect(metadata.rings[2].outerRadius).toBe(60);
    expect(metadata.rings[1].areaPixels).toBeGreaterThan(metadata.rings[0].areaPixels);
    expect(metadata.rings[2].bounds.left).toBe(0);
    expect(metadata.rings[2].bounds.top).toBe(0);
  });
});

describe("image quality scoring", () => {
  test("scoreRingSymmetry gives radial bands a high rotated-ring similarity", () => {
    const image = radialBandsImage(64, 4);
    const radii = balancedRingRadii(32, 4);
    const report = scoreRingSymmetry(image, radii, { rotationSteps: 8, sampleStride: 3 });

    expect(report.maxSimilarity).toBeGreaterThan(IMAGE_QUALITY_DEFAULTS.maxRingSymmetrySimilarity);
    expect(report.passes).toBe(false);
  });

  test("scoreRingSymmetry keeps asymmetric diagonal features below the similarity threshold", () => {
    const image = diagonalFeatureImage(64);
    const radii = balancedRingRadii(32, 4);
    const report = scoreRingSymmetry(image, radii, { rotationSteps: 8, sampleStride: 3 });

    expect(report.maxSimilarity).toBeLessThan(IMAGE_QUALITY_DEFAULTS.maxRingSymmetrySimilarity);
    expect(report.passes).toBe(true);
  });

  test("scoreCrossRingEdges rejects weak boundaries and accepts features crossing ring boundaries", () => {
    const weak = rgbaImage(64, 64, () => [90, 90, 90, 255]);
    const strong = diagonalFeatureImage(64);
    const radii = balancedRingRadii(32, 4);

    const weakReport = scoreCrossRingEdges(weak, radii, { angularSamples: 72 });
    const strongReport = scoreCrossRingEdges(strong, radii, { angularSamples: 72 });

    expect(weakReport.strongBoundaryCount).toBe(0);
    expect(weakReport.passes).toBe(false);
    expect(strongReport.strongBoundaryCount).toBeGreaterThanOrEqual(2);
    expect(strongReport.passes).toBe(true);
  });

  test("evaluateImageFairness combines symmetry and boundary-edge checks for generation rejection", () => {
    const symmetric = radialBandsImage(64, 4);
    const fair = diagonalFeatureImage(64);

    expect(evaluateImageFairness(symmetric, { ringCount: 4 }).passes).toBe(false);
    expect(evaluateImageFairness(fair, { ringCount: 4 }).passes).toBe(true);
  });
});
