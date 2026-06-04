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

## Puzzle Generation And Solving

Arcane Rings models a level as modular linear algebra over ring ticks. Each
ring offset is stored modulo `q`, where `q` is the number of discrete rotation
ticks in a full circle. The coupling matrix `A` is indexed as
`A[visualRing][controlRing]`: rotating a control ring by `d` ticks adds
`A[visualRing][controlRing] * d` ticks to that visual ring, modulo `q`.

Generation algorithm:

1. Load the difficulty config, which defines ring count `n`, modulus `q`,
   allowed coupling factors, edge limits, out-degree limits, and accepted
   difficulty score ranges.
2. Create a deterministic seeded RNG from `seed:attempt`, so the same level
   input produces the same accepted level.
3. Build an `n x n` unit lower-triangular matrix. The diagonal is `1`, so every
   control ring always rotates itself.
4. Enumerate possible coupling edges where `visualRing > controlRing`. This
   keeps the dependency graph acyclic and makes the matrix easy to invert.
5. Shuffle the possible edges, choose a target edge count, then add edges until
   the target is reached or out-degree limits stop more additions. Each edge
   receives a random factor from the difficulty `factorSet`.
6. Compute `A^-1 mod q` using unit lower-triangular inversion.
7. Sample a hidden solution vector `s`: choose an accepted total tick distance,
   choose active rings, distribute the tick distances across them, and assign
   each active distance a random clockwise or counter-clockwise sign.
8. Apply the solution through the matrix: `applied = A * s mod q`.
9. Set the playable scrambled offsets to `initialOffsets = -applied mod q`.
   This guarantees that applying `s` returns every ring to `0`.
10. Score the level using move cost, active move count, scramble cost, direct
    and inverse coupling counts, weighted coupling strength, degree limits, and
    dependency depth. Reject and retry if the level starts solved or falls
    outside the difficulty bounds.

Solver steps:

1. Let `b` be the current offset vector. The target is
   `b + A * x = 0 mod q`, where `x` is the move vector to find.
2. Because `A` is unit lower-triangular, solve by forward substitution from the
   innermost ring to the outermost ring.
3. For each ring `i`, compute the effect already caused by previous controls:
   `known = sum(A[i][j] * x[j]) for j < i`.
4. Choose `x[i] = -(b[i] + known) mod q`. The diagonal value is `1`, so this
   directly cancels ring `i`.
5. After all rings are processed, applying the move vector `x` makes
   `b + A * x` equal the zero vector modulo `q`.

The same solution can also be computed directly as `x = A^-1 * (-b) mod q`.

Example matrix from the demo level:

```txt
q = 8

A = [
  [1, 0, 0, 0, 0],
  [1, 1, 0, 0, 0],
  [1, 2, 1, 0, 0],
  [0, 1, 1, 1, 0],
  [0, 0, 1, 2, 1],
]

solution      = [1, 5, 2, 3, 0]
A * solution  = [1, 6, 5, 2, 0] mod 8
initialOffsets = [7, 2, 3, 6, 0]

initialOffsets + A * solution = [0, 0, 0, 0, 0] mod 8
```

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
