import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup } from "@testing-library/react";

import { App } from "../src/App";
import { WinScreen } from "../src/ui/screens/WinScreen";

afterEach(() => {
  cleanup();
});

describe("Project Circles menu and overlay UI", () => {
  test("main menu exposes the required product flows", async () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Project Circles" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Play" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Daily puzzle" })).toBeTruthy();
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
    expect(within(dialog).getByLabelText("High contrast ring borders")).toBeTruthy();
    expect(within(dialog).getByRole("button", { name: "Reset progress" })).toBeTruthy();
  });

  test("image collection shell shows restored archive metadata", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Image collection" }));

    expect(screen.getByRole("heading", { name: "Image Collection" })).toBeTruthy();
    expect(screen.getByText("Moon Gate Archive")).toBeTruthy();
    expect(screen.getByText("Best moves 24")).toBeTruthy();
    expect(screen.getByText("Unlocked 2026-06-02")).toBeTruthy();
  });
});

describe("Win screen shell", () => {
  test("shows scoring summary and expected actions", () => {
    render(
      <WinScreen
        result={{
          title: "Moon Gate Restored",
          stars: 3,
          playerTickCost: 24,
          optimalTickCost: 22,
          elapsedTime: "04:18",
          hintCount: 1,
          difficultyScore: "Medium · T22 · F6",
        }}
        onNext={() => undefined}
        onRetry={() => undefined}
        onMenu={() => undefined}
      />,
    );

    expect(screen.getByRole("dialog", { name: "Moon Gate Restored" })).toBeTruthy();
    expect(screen.getByText("Player ticks 24")).toBeTruthy();
    expect(screen.getByText("Optimal ticks 22")).toBeTruthy();
    expect(screen.getByText("Hints 1")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Next level" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Retry" })).toBeTruthy();
  });
});
