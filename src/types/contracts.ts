import type { GameAction, Level, RuntimeState } from "./game";

export type RuntimeAdapter = {
  createInitialState(level: Level, now?: number): RuntimeState;
  dispatch(action: GameAction, state: RuntimeState): RuntimeState;
};

export type PuzzleRendererAdapter = {
  mount(canvas: HTMLCanvasElement, level: Level, state: RuntimeState): void;
  update(level: Level, state: RuntimeState): void;
  destroy(): void;
};

export type LevelProvider = {
  getSeededLevel(seed: string): Promise<Level> | Level;
};
