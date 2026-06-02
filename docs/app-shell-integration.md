# App Shell Integration

This branch establishes the PWA and React shell for Project Circles. It intentionally does not implement the math engine, level generation, image fairness checks, or production renderer.

## Public Contracts

- `src/types/game.ts` mirrors the design spec data models for `Level`, `RuntimeState`, player moves, settings, and progress records.
- `src/types/contracts.ts` defines adapter boundaries for future runtime, renderer, and level-provider workstreams.
- `src/config/appConfig.ts` holds app-level constants, including the placeholder seed and service-worker path.
- `src/state/placeholderGameState.ts` provides deterministic seed data until the real generator/runtime replaces it.

## Integration Points

- Runtime workstreams should implement `RuntimeAdapter` and replace `createPlaceholderRuntimeState`.
- Renderer workstreams should mount through a canvas-oriented adapter and replace `PlaceholderPuzzleCanvas` internals without moving HUD ownership into canvas.
- Generation and image-fairness workstreams should provide `LevelProvider` implementations that return the `Level` shape from `src/types/game.ts`.
- UI/menu workstreams can add screens under `src/app` or future `src/ui` folders while keeping persistent puzzle HUD coverage compact.

## Verification

Use Bun for this worktree:

```sh
/opt/homebrew/bin/bun install
/opt/homebrew/bin/bun run typecheck
/opt/homebrew/bin/bun test
/opt/homebrew/bin/bunx playwright test
```
