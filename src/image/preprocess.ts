export type RgbaImage = {
  width: number;
  height: number;
  data: Uint8ClampedArray;
};

export type CropRect = {
  left: number;
  top: number;
  size: number;
};

export function centerSquareCrop(width: number, height: number): CropRect {
  assertPositiveInteger(width, "width");
  assertPositiveInteger(height, "height");

  const size = Math.min(width, height);
  return {
    left: Math.floor((width - size) / 2),
    top: Math.floor((height - size) / 2),
    size,
  };
}

export function cropCenterSquare(image: RgbaImage): RgbaImage {
  assertImage(image);

  const crop = centerSquareCrop(image.width, image.height);
  const data = new Uint8ClampedArray(crop.size * crop.size * 4);

  for (let y = 0; y < crop.size; y += 1) {
    for (let x = 0; x < crop.size; x += 1) {
      copyPixel(image, crop.left + x, crop.top + y, data, y * crop.size + x);
    }
  }

  return {
    width: crop.size,
    height: crop.size,
    data,
  };
}

export function resizeNearestNeighbor(image: RgbaImage, targetWidth: number, targetHeight: number): RgbaImage {
  assertImage(image);
  assertPositiveInteger(targetWidth, "targetWidth");
  assertPositiveInteger(targetHeight, "targetHeight");

  const data = new Uint8ClampedArray(targetWidth * targetHeight * 4);

  for (let y = 0; y < targetHeight; y += 1) {
    const sourceY = Math.min(image.height - 1, Math.floor((y / targetHeight) * image.height));
    for (let x = 0; x < targetWidth; x += 1) {
      const sourceX = Math.min(image.width - 1, Math.floor((x / targetWidth) * image.width));
      copyPixel(image, sourceX, sourceY, data, y * targetWidth + x);
    }
  }

  return {
    width: targetWidth,
    height: targetHeight,
    data,
  };
}

export function getPixel(image: RgbaImage, x: number, y: number): [number, number, number, number] {
  const clampedX = clamp(Math.round(x), 0, image.width - 1);
  const clampedY = clamp(Math.round(y), 0, image.height - 1);
  const offset = (clampedY * image.width + clampedX) * 4;

  return [image.data[offset], image.data[offset + 1], image.data[offset + 2], image.data[offset + 3]];
}

export function assertImage(image: RgbaImage): void {
  assertPositiveInteger(image.width, "image.width");
  assertPositiveInteger(image.height, "image.height");

  const expectedLength = image.width * image.height * 4;
  if (!(image.data instanceof Uint8ClampedArray) || image.data.length !== expectedLength) {
    throw new Error(`Expected RGBA data length ${expectedLength}, received ${image.data?.length ?? "unknown"}`);
  }
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function assertPositiveInteger(value: number, name: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
}

function copyPixel(source: RgbaImage, sourceX: number, sourceY: number, targetData: Uint8ClampedArray, targetPixelIndex: number): void {
  const sourceOffset = (sourceY * source.width + sourceX) * 4;
  const targetOffset = targetPixelIndex * 4;

  targetData[targetOffset] = source.data[sourceOffset];
  targetData[targetOffset + 1] = source.data[sourceOffset + 1];
  targetData[targetOffset + 2] = source.data[sourceOffset + 2];
  targetData[targetOffset + 3] = source.data[sourceOffset + 3];
}
