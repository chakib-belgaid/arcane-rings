# Arcane Rings

Arcane Rings is a mobile-first browser puzzle game about restoring circular
images. Each level slices an image into concentric rings. Players rotate control
rings to align the picture, while level-specific coupling rules can make one
move affect multiple visual rings.

The current visual direction is compact fantasy UI, luminous ring
feedback, and a PWA shell built around a canvas puzzle surface.

## Features

- React and Vite app shell with installable PWA metadata.
- Deterministic level generation from seeded puzzle parameters.
- Coupled ring-rotation math, move tracking, hints, win detection, and scoring.
- Canvas renderer with selected-ring, affected-ring, drag-preview, and settle
  feedback.
- Image preprocessing and fairness checks for ring-based puzzle suitability.
- Menu, difficulty, level, image collection, settings, puzzle HUD, coupling map,
  and win screens.
- Vitest coverage plus Playwright acceptance and responsive-layout tests.

## Tech Stack

- React 18
- TypeScript
- Vite
- Bun
- Vitest
- Playwright

## Getting Started

Install dependencies:

```sh
/opt/homebrew/bin/bun install --frozen-lockfile
```

Start the development server:

```sh
/opt/homebrew/bin/bun run dev
```

Run the main verification commands:

```sh
/opt/homebrew/bin/bun run typecheck
/opt/homebrew/bin/bun run test
/opt/homebrew/bin/bun run build
/opt/homebrew/bin/bun run playwright
```

Run the standalone Playwright fixture suite:

```sh
/opt/homebrew/bin/bun run playwright:fixture
```

## Project Structure

- `src/app` contains the early app shell and service-worker registration.
- `src/ui` contains the product screens, HUD, dialogs, and shared UI types.
- `src/render` contains the canvas puzzle renderer.
- `src/interaction` contains pointer and touch drag behavior.
- `src/generation`, `src/math`, and `src/state` contain the puzzle model.
- `src/image` contains image preprocessing, masks, and quality scoring.
- `tests` contains unit, integration, fixture, and Playwright tests.
- `e2e` contains the main browser-level puzzle canvas checks.
- `docs` contains implementation notes and the product design spec.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).
