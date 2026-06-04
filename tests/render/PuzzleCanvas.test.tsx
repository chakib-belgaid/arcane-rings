import React from "react";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { PuzzleCanvas } from "../../src/render/PuzzleCanvas";
import { drawPuzzleRings } from "../../src/render/ringRenderer";

vi.mock("../../src/render/ringRenderer", () => ({
  drawPuzzleRings: vi.fn(),
}));

type FrameCallback = (time: number) => void;

const drawPuzzleRingsMock = vi.mocked(drawPuzzleRings);

function latestDrawnOffsets(): number[] {
  const lastCall = drawPuzzleRingsMock.mock.calls.at(-1);
  if (!lastCall) {
    throw new Error("Expected drawPuzzleRings to be called");
  }
  return lastCall[1].offsets;
}

function runLatestFrame(callbacks: Map<number, FrameCallback>, time: number): void {
  const latestCallback = Array.from(callbacks.values()).at(-1);
  if (!latestCallback) {
    throw new Error("Expected an animation frame to be scheduled");
  }
  latestCallback(time);
}

describe("PuzzleCanvas", () => {
  let frameId: number;
  let callbacks: Map<number, FrameCallback>;

  beforeEach(() => {
    drawPuzzleRingsMock.mockClear();
    frameId = 0;
    callbacks = new Map();

    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      frameId += 1;
      callbacks.set(frameId, callback);
      return frameId;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation((id) => {
      callbacks.delete(id);
    });
    vi.spyOn(window.performance, "now").mockReturnValue(0);
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn(() => ({
        matches: false,
        media: "(prefers-reduced-motion: reduce)",
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    Object.defineProperty(window, "devicePixelRatio", {
      configurable: true,
      value: 1,
    });

    class TestPointerEvent extends window.MouseEvent {
      pointerId: number;

      constructor(type: string, eventInitDict: PointerEventInit = {}) {
        super(type, eventInitDict);
        this.pointerId = eventInitDict.pointerId ?? 0;
      }
    }

    Object.defineProperty(window, "PointerEvent", {
      configurable: true,
      value: TestPointerEvent,
    });

    class TestImage {
      decoding = "async";
      naturalWidth = 64;
      naturalHeight = 64;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      }
    }

    Object.defineProperty(window, "Image", {
      configurable: true,
      value: TestImage,
    });
    Object.defineProperty(window.HTMLCanvasElement.prototype, "getContext", {
      configurable: true,
      value: vi.fn(() => ({
        restore: vi.fn(),
        save: vi.fn(),
        scale: vi.fn(),
      } as unknown as CanvasRenderingContext2D)),
    });
    Object.defineProperty(window.HTMLCanvasElement.prototype, "setPointerCapture", {
      configurable: true,
      value: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  test("interrupting settle with a drag preserves the current displayed offsets", async () => {
    const matrix = [
      [1, 0],
      [0, 1],
    ];

    const { getByTestId, rerender } = render(
      <PuzzleCanvas imageSrc="test.png" offsets={[0, 0]} matrix={matrix} q={8} ringRadii={[0, 70, 140]} />,
    );

    await act(async () => {
      await Promise.resolve();
    });

    rerender(
      <PuzzleCanvas imageSrc="test.png" offsets={[2, 0]} matrix={matrix} q={8} ringRadii={[0, 70, 140]} />,
    );

    await act(async () => {
      runLatestFrame(callbacks, 55);
    });

    const settlingOffsets = latestDrawnOffsets();
    expect(settlingOffsets[0]).toBeGreaterThan(0);
    expect(settlingOffsets[0]).toBeLessThan(2);

    const host = getByTestId("puzzle-canvas-host");
    const canvas = getByTestId("puzzle-canvas");
    vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 0,
      width: 280,
      height: 280,
      top: 0,
      right: 280,
      bottom: 280,
      left: 0,
      toJSON: () => undefined,
    });

    const drawCountBeforePointerDown = drawPuzzleRingsMock.mock.calls.length;

    fireEvent.pointerDown(canvas, {
      pointerId: 1,
      clientX: 210,
      clientY: 140,
    });

    expect(host.getAttribute("data-selected-ring")).toBe("1");
    expect(drawPuzzleRingsMock.mock.calls.length).toBeGreaterThan(drawCountBeforePointerDown);
    expect(latestDrawnOffsets()[0]).toBe(settlingOffsets[0]);
  });

  test("drag preview redraws with fractional offsets before a full tick is reached", async () => {
    const matrix = [
      [1, 0],
      [0, 1],
    ];

    const { getByTestId } = render(
      <PuzzleCanvas imageSrc="test.png" offsets={[0, 0]} matrix={matrix} q={8} ringRadii={[0, 70, 140]} />,
    );

    await act(async () => {
      await Promise.resolve();
    });

    const host = getByTestId("puzzle-canvas-host");
    const canvas = getByTestId("puzzle-canvas");
    vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 0,
      width: 280,
      height: 280,
      top: 0,
      right: 280,
      bottom: 280,
      left: 0,
      toJSON: () => undefined,
    });

    const center = 140;
    const radius = 80;
    const startAngle = -Math.PI / 2;
    const deltaAngle = ((2 * Math.PI) / 8) * 0.4;

    await act(async () => {
      fireEvent.pointerDown(canvas, {
        pointerId: 1,
        clientX: center + Math.cos(startAngle) * radius,
        clientY: center + Math.sin(startAngle) * radius,
      });
      fireEvent.pointerMove(canvas, {
        pointerId: 1,
        clientX: center + Math.cos(startAngle + deltaAngle) * radius,
        clientY: center + Math.sin(startAngle + deltaAngle) * radius,
      });
    });

    expect(host.getAttribute("data-preview-ticks")).toBe("0");
    expect(latestDrawnOffsets()[1]).toBeCloseTo(0.4);
  });
});
