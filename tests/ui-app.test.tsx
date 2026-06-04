import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import { cleanup } from "@testing-library/react";

vi.mock("../src/render/PuzzleCanvas", () => ({
  PuzzleCanvas: ({
    inputDisabled,
    offsets,
    onCommit,
  }: {
    inputDisabled?: boolean;
    offsets: number[];
    onCommit?: (move: { controlRing: number; deltaTicks: number }) => void;
  }) => (
    <div>
      <button
        type="button"
        data-testid="puzzle-canvas"
        data-offsets={offsets.join(",")}
        disabled={inputDisabled}
        onClick={() => onCommit?.({ controlRing: 0, deltaTicks: 1 })}
      >
        Puzzle canvas
      </button>
      <button
        type="button"
        data-testid="commit-ring-1-plus1"
        disabled={inputDisabled}
        onClick={() => onCommit?.({ controlRing: 0, deltaTicks: 1 })}
      >
        Ring 1 +1
      </button>
      <button
        type="button"
        data-testid="commit-ring-2-minus2"
        disabled={inputDisabled}
        onClick={() => onCommit?.({ controlRing: 1, deltaTicks: -2 })}
      >
        Ring 2 -2
      </button>
      <button
        type="button"
        data-testid="commit-ring-3-minus3"
        disabled={inputDisabled}
        onClick={() => onCommit?.({ controlRing: 2, deltaTicks: -3 })}
      >
        Ring 3 -3
      </button>
      <button
        type="button"
        data-testid="commit-ring-4-plus1"
        disabled={inputDisabled}
        onClick={() => onCommit?.({ controlRing: 3, deltaTicks: 1 })}
      >
        Ring 4 +1
      </button>
    </div>
  ),
}));

import { App } from "../src/App";
import { WinScreen } from "../src/ui/screens/WinScreen";

async function solveFixtureLevel(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.click(screen.getByTestId("commit-ring-1-plus1"));
  await user.click(screen.getByTestId("commit-ring-2-minus2"));
  await user.click(screen.getByTestId("commit-ring-3-minus3"));
  await user.click(screen.getByTestId("commit-ring-4-plus1"));
}

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe("Arcane Rings menu and overlay UI", () => {
  test("main menu exposes the required product flows", async () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Arcane Rings" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Play" })).toBeTruthy();
    expect((screen.getByRole("button", { name: "Daily puzzle" }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByRole("button", { name: "Difficulty selection" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Image collection" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Settings" })).toBeTruthy();
  });

  test("difficulty and level selection shells preserve track metadata", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Difficulty selection" }));
    expect(screen.getByRole("heading", { name: "Difficulty" })).toBeTruthy();
    expect(screen.getByText("Beginner")).toBeTruthy();
    expect(screen.getByText("Expert")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Open Beginner levels" }));
    expect(screen.getByRole("heading", { name: "Beginner Levels" })).toBeTruthy();
    expect(screen.getByText("No unlocked Beginner levels yet.")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Back to difficulty" }));

    await user.click(screen.getByRole("button", { name: "Open Medium levels" }));
    expect(screen.getByRole("heading", { name: "Medium Levels" })).toBeTruthy();
    expect(screen.getByText("Rings 5")).toBeTruthy();
    expect(screen.getByText("Hints available")).toBeTruthy();
  });

  test("puzzle screen keeps a compact HUD and gates input while coupling map is open", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Play" }));
    expect(screen.getByTestId("puzzle-stage").getAttribute("data-input-gated")).toBe("false");
    expect(screen.getByTestId("puzzle-hud").classList.contains("hud--compact")).toBe(true);
    expect(screen.queryByTestId("normal-play-center-overlay")).toBeNull();
    expect((screen.getByRole("button", { name: "Undo" }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByRole("button", { name: "Complete fixture level" })).toBeNull();

    const initialOffsets = screen.getByTestId("puzzle-canvas").getAttribute("data-offsets");
    await user.click(screen.getByTestId("puzzle-canvas"));
    expect(screen.getByText("Moves").nextElementSibling?.textContent).toBe("1");
    expect((screen.getByRole("button", { name: "Undo" }) as HTMLButtonElement).disabled).toBe(false);

    await user.click(screen.getByRole("button", { name: "Undo" }));
    expect(screen.getByText("Moves").nextElementSibling?.textContent).toBe("0");
    expect(screen.getByTestId("puzzle-canvas").getAttribute("data-offsets")).toBe(initialOffsets);
    expect((screen.getByRole("button", { name: "Undo" }) as HTMLButtonElement).disabled).toBe(true);

    const couplingButton = screen.getByRole("button", { name: "Open coupling map" });
    await user.click(couplingButton);

    const dialog = screen.getByRole("dialog", { name: "Coupling Map" });
    expect(screen.getByTestId("puzzle-stage").getAttribute("data-input-gated")).toBe("true");
    expect(within(dialog).getByText("Ring 1 -> Ring 2 x2")).toBeTruthy();

    await user.click(within(dialog).getByRole("button", { name: "Close coupling map" }));
    expect(screen.getByTestId("puzzle-stage").getAttribute("data-input-gated")).toBe("false");
    expect(document.activeElement).toBe(couplingButton);
  });

  test("settings overlay pauses puzzle input and exposes persistence-safe controls", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Play" }));
    const settingsButton = screen.getByRole("button", { name: "Open settings" });
    await user.click(settingsButton);

    const dialog = screen.getByRole("dialog", { name: "Settings" });
    expect(screen.getByTestId("puzzle-stage").getAttribute("data-input-gated")).toBe("true");
    expect(within(dialog).getByLabelText("Reduced motion")).toBeTruthy();
    expect(within(dialog).getByLabelText("Sound effects")).toBeTruthy();
    expect((within(dialog).getByLabelText("Volume") as HTMLInputElement).value).toBe("100");
    expect(within(dialog).getByLabelText("High contrast ring borders")).toBeTruthy();
    expect(within(dialog).getByRole("button", { name: "Reset progress" })).toBeTruthy();

    await user.click(within(dialog).getByLabelText("Reduced motion"));
    expect((within(dialog).getByLabelText("Reduced motion") as HTMLInputElement).checked).toBe(true);

    await user.click(within(dialog).getByRole("button", { name: "Preview sound effects" }));
    expect(within(dialog).getByRole("status").textContent).toContain("Sound preview played");

    await user.click(within(dialog).getByRole("button", { name: "Restore defaults" }));
    expect((within(dialog).getByLabelText("Reduced motion") as HTMLInputElement).checked).toBe(false);
    expect((within(dialog).getByLabelText("Volume") as HTMLInputElement).value).toBe("100");
    expect(within(dialog).getByRole("status").textContent).toContain("Defaults restored");

    fireEvent.change(within(dialog).getByLabelText("Volume"), { target: { value: "70" } });
    expect((within(dialog).getByLabelText("Volume") as HTMLInputElement).value).toBe("70");
    expect(within(dialog).getByText("70%")).toBeTruthy();

    await user.click(within(dialog).getByLabelText("High contrast ring borders"));
    await user.click(within(dialog).getByRole("button", { name: "Close settings" }));
    await user.click(settingsButton);

    const reopened = screen.getByRole("dialog", { name: "Settings" });
    expect((within(reopened).getByLabelText("High contrast ring borders") as HTMLInputElement).checked).toBe(true);
    expect((within(reopened).getByLabelText("Volume") as HTMLInputElement).value).toBe("70");
  });

  test("reset progress clears current and legacy best-score keys", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem("arcane-rings:best-score:fixture-level-01:Moon Gate Archive", "{}");
    window.localStorage.setItem("project-circles:best-score:fixture-level-01:Moon Gate Archive", "{}");
    window.localStorage.setItem("project-circles:settings", JSON.stringify({ volume: 0.7 }));
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Settings" }));
    const dialog = screen.getByRole("dialog", { name: "Settings" });

    await user.click(within(dialog).getByRole("button", { name: "Reset progress" }));
    await user.click(within(dialog).getByRole("button", { name: "Confirm reset" }));

    expect(window.localStorage.getItem("arcane-rings:best-score:fixture-level-01:Moon Gate Archive")).toBeNull();
    expect(window.localStorage.getItem("project-circles:best-score:fixture-level-01:Moon Gate Archive")).toBeNull();
    expect(window.localStorage.getItem("project-circles:settings")).not.toBeNull();
    expect(within(dialog).getByRole("status").textContent).toContain("Progress reset");
  });

  test("solution reference opens fullscreen and gates puzzle input", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Play" }));
    expect(screen.getByTestId("puzzle-stage").getAttribute("data-input-gated")).toBe("false");
    expect(screen.getByRole("button", { name: "Toggle reference thumbnail" }).getAttribute("aria-pressed")).toBe(
      "true",
    );

    await user.click(screen.getByRole("button", { name: "Open solution reference fullscreen" }));
    expect(screen.getByRole("dialog", { name: "Solution Reference" })).toBeTruthy();
    expect(screen.getByTestId("puzzle-stage").getAttribute("data-input-gated")).toBe("true");

    await user.click(screen.getByRole("button", { name: "Close solution reference" }));
    expect(screen.getByTestId("puzzle-stage").getAttribute("data-input-gated")).toBe("false");

    await user.click(screen.getByRole("button", { name: "Toggle reference thumbnail" }));
    expect(screen.getByRole("button", { name: "Toggle reference thumbnail" }).getAttribute("aria-pressed")).toBe(
      "false",
    );
    expect(screen.queryByRole("button", { name: "Open solution reference fullscreen" })).toBeNull();
  });

  test("completion report appears after solving the current scramble", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Play" }));
    expect(screen.getByTestId("puzzle-canvas").getAttribute("data-offsets")).toBe("11,0,4,3,2");

    await solveFixtureLevel(user);

    const report = await screen.findByRole("dialog", { name: "Moon Gate Archive Restored" });
    expect(within(report).getByTestId("win-movements").textContent).toContain("Movements");
    expect(within(report).getByTestId("win-movements").textContent).toContain("4");
    expect(within(report).getByTestId("win-duration").textContent).toContain("Duration");
    expect(within(report).getByTestId("win-duration").textContent).toContain("00:00");
    expect(within(report).getByTestId("win-tick-cost").textContent).toContain("7 ticks");
    expect(within(report).getByText("4 moves · 7 ticks · 00:00")).toBeTruthy();
    expect(within(report).getByText("Optimal ticks").nextElementSibling?.textContent).toBe("7");
  });

  test("completion report keeps the durable best score after a worse retry", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Play" }));
    await solveFixtureLevel(user);
    expect(within(screen.getByTestId("win-best-score")).getByText("4 moves · 7 ticks · 00:00")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Retry" }));
    await user.click(screen.getByTestId("puzzle-canvas"));
    await user.click(screen.getByRole("button", { name: "Undo" }));
    await solveFixtureLevel(user);

    expect(within(screen.getByTestId("win-movements")).getByText("4")).toBeTruthy();
    expect(within(screen.getByTestId("win-tick-cost")).getByText("8 ticks")).toBeTruthy();
    expect(within(screen.getByTestId("win-best-score")).getByText("4 moves · 7 ticks · 00:00")).toBeTruthy();
  });

  test("hint button advances through contextual layers", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Play" }));

    await user.click(screen.getByRole("button", { name: "Hint" }));
    expect(screen.getByTestId("hint-panel").textContent).toBe("Focus Ring 3");

    await user.click(screen.getByRole("button", { name: "Hint" }));
    expect(screen.getByTestId("hint-panel").textContent).toBe("Ring 3 still needs adjustment");

    await user.click(screen.getByRole("button", { name: "Hint" }));
    expect(screen.getByTestId("hint-panel").textContent).toBe("Ring 3 counterclockwise 3 ticks");
  });

  test("image collection shell shows restored archive metadata", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Image collection" }));

    expect(screen.getByRole("heading", { name: "Image Collection" })).toBeTruthy();
    expect(screen.getByText("Moon Gate Archive")).toBeTruthy();
    expect(screen.getByText("Solar Greenhouse Observatory")).toBeTruthy();
    expect(screen.getByText("Neon Tidal City")).toBeTruthy();
    expect(screen.getByText("Best moves 24")).toBeTruthy();
    expect(screen.getByText("Unlocked 2026-06-02")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Upload image" })).toBeTruthy();
  });

  test("selects default presets and uploaded images for play", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Image collection" }));
    await user.click(screen.getByRole("button", { name: "Select Neon Tidal City" }));
    await user.click(screen.getByRole("button", { name: "Play selected image" }));
    expect(screen.getByTestId("puzzle-stage").getAttribute("data-image-title")).toBe("Neon Tidal City");

    await user.click(screen.getByRole("button", { name: "Return to main menu" }));
    await user.click(screen.getByRole("button", { name: "Image collection" }));

    const file = new File(["custom"], "custom-puzzle.png", { type: "image/png" });
    await user.upload(screen.getByTestId("image-upload-input"), file);

    expect(await screen.findByText("custom puzzle")).toBeTruthy();
    expect(screen.getByRole("status").textContent).toContain("custom puzzle added");
    expect(screen.getByRole("button", { name: "Select custom puzzle" }).getAttribute("aria-pressed")).toBe("true");

    await user.click(screen.getByRole("button", { name: "Play selected image" }));
    expect(screen.getByTestId("puzzle-stage").getAttribute("data-image-title")).toBe("custom puzzle");
  });
});

describe("Win screen shell", () => {
  test("shows scoring summary and expected actions", () => {
    render(
      <WinScreen
        result={{
          title: "Moon Gate Restored",
          stars: 3,
          moveCount: 9,
          playerTickCost: 24,
          optimalTickCost: 22,
          elapsedTime: "04:18",
          elapsedMs: 258000,
          hintCount: 1,
          difficultyScore: "Medium · T22 · F6",
          bestScore: "9 moves · 24 ticks · 04:18",
          bestMoveCount: 9,
          bestTickCost: 24,
          bestElapsedTime: "04:18",
          isPersonalBest: true,
        }}
        onNext={() => undefined}
        onRetry={() => undefined}
        onMenu={() => undefined}
      />,
    );

    expect(screen.getByRole("dialog", { name: "Moon Gate Restored" })).toBeTruthy();
    expect(screen.getByTestId("win-movements").textContent).toContain("9");
    expect(screen.getByTestId("win-duration").textContent).toContain("04:18");
    expect(screen.getByTestId("win-best-score").textContent).toContain("9 moves · 24 ticks · 04:18");
    expect(screen.getByTestId("win-best-score").textContent).toContain("New best");
    expect(screen.getByTestId("win-tick-cost").textContent).toContain("24 ticks");
    expect(screen.getByText("Optimal ticks")).toBeTruthy();
    expect(screen.getByText("Hints")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Play again" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Retry" })).toBeTruthy();
  });
});
