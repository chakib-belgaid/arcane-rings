import { clamp } from "./preprocess";

export type RingBounds = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

export type RingMetadata = {
  index: number;
  innerRadius: number;
  outerRadius: number;
  centerX: number;
  centerY: number;
  areaPixels: number;
  bounds: RingBounds;
};

export type RingMaskMetadata = {
  size: number;
  ringCount: number;
  radius: number;
  centerX: number;
  centerY: number;
  radii: number[];
  rings: RingMetadata[];
};

export type RingMaskOptions = {
  size: number;
  ringCount: number;
  radius?: number;
  power?: number;
};

export function balancedRingRadii(radius: number, ringCount: number, power = 0.85): number[] {
  if (!Number.isFinite(radius) || radius <= 0) {
    throw new Error("radius must be a positive finite number");
  }

  if (!Number.isInteger(ringCount) || ringCount <= 0) {
    throw new Error("ringCount must be a positive integer");
  }

  if (!Number.isFinite(power) || power <= 0) {
    throw new Error("power must be a positive finite number");
  }

  return Array.from({ length: ringCount + 1 }, (_, index) => radius * (index / ringCount) ** power);
}

export function createRingMaskMetadata(options: RingMaskOptions): RingMaskMetadata {
  const { size, ringCount, power } = options;

  if (!Number.isInteger(size) || size <= 0) {
    throw new Error("size must be a positive integer");
  }

  const radius = options.radius ?? size / 2;
  const centerX = size / 2;
  const centerY = size / 2;
  const radii = balancedRingRadii(radius, ringCount, power);

  return {
    size,
    ringCount,
    radius,
    centerX,
    centerY,
    radii,
    rings: radii.slice(0, -1).map((innerRadius, index) => {
      const outerRadius = radii[index + 1];
      return {
        index,
        innerRadius,
        outerRadius,
        centerX,
        centerY,
        areaPixels: Math.PI * (outerRadius ** 2 - innerRadius ** 2),
        bounds: ringBounds(size, centerX, centerY, outerRadius),
      };
    }),
  };
}

function ringBounds(size: number, centerX: number, centerY: number, outerRadius: number): RingBounds {
  return {
    left: clamp(Math.floor(centerX - outerRadius), 0, size),
    top: clamp(Math.floor(centerY - outerRadius), 0, size),
    right: clamp(Math.ceil(centerX + outerRadius), 0, size),
    bottom: clamp(Math.ceil(centerY + outerRadius), 0, size),
  };
}
