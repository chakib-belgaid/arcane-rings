import { describe, expect, test } from "vitest";

import { drawPuzzleRings } from "../../src/render/ringRenderer";

type RecordedOperation =
  | { kind: "call"; name: string; args: unknown[] }
  | { kind: "set"; name: string; value: unknown };

function isSetOperation(
  operation: RecordedOperation,
  name: string,
): operation is Extract<RecordedOperation, { kind: "set" }> {
  return operation.kind === "set" && operation.name === name;
}

function makeRecordingContext(): {
  context: CanvasRenderingContext2D;
  operations: RecordedOperation[];
} {
  const operations: RecordedOperation[] = [];
  const state: Record<string, unknown> = {};

  const context = new Proxy(state, {
    get(target, property) {
      if (property in target) {
        return target[property as string];
      }

      return (...args: unknown[]) => {
        operations.push({ kind: "call", name: String(property), args });
      };
    },
    set(target, property, value) {
      operations.push({ kind: "set", name: String(property), value });
      target[property as string] = value;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;

  return { context, operations };
}

describe("drawPuzzleRings", () => {
  test("draws selected and affected ring glows with one shared color", () => {
    const { context, operations } = makeRecordingContext();
    const image = { naturalWidth: 128, naturalHeight: 128 } as CanvasImageSource;

    drawPuzzleRings(context, {
      image,
      width: 200,
      height: 200,
      ringRadii: [0, 50, 100],
      offsets: [0, 0],
      q: 8,
      selectedRing: 1,
      affectedRings: [0, 1],
      previewTicks: 1,
    });

    const shadowColors = operations
      .filter((operation) => isSetOperation(operation, "shadowColor"))
      .map((operation) => operation.value);
    const shadowBlurs = operations
      .filter((operation) => isSetOperation(operation, "shadowBlur"))
      .map((operation) => operation.value);

    expect(new Set(shadowColors)).toEqual(new Set(["rgba(247, 192, 94, 0.78)"]));
    expect(shadowBlurs).toContain(24);
    expect(shadowBlurs).toContain(17);
  });

  test("dims unrelated rings between selected and non-adjacent affected rings", () => {
    const { context, operations } = makeRecordingContext();
    const image = { naturalWidth: 128, naturalHeight: 128 } as CanvasImageSource;

    drawPuzzleRings(context, {
      image,
      width: 240,
      height: 240,
      ringRadii: [0, 40, 80, 120],
      offsets: [0, 0, 0],
      q: 8,
      selectedRing: 0,
      affectedRings: [0, 2],
      previewTicks: 1,
    });

    const fillStyles = operations
      .filter((operation) => isSetOperation(operation, "fillStyle"))
      .map((operation) => operation.value);

    expect(fillStyles.filter((value) => value === "rgba(4, 8, 11, 0.34)")).toHaveLength(1);
    expect(fillStyles).toContain("rgba(224, 173, 86, 0.14)");
    expect(fillStyles).toContain("rgba(224, 173, 86, 0.2)");
  });
});
