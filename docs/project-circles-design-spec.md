# Project Circles Design Spec

## 1. Product Summary

Project Circles is a mobile-first PWA puzzle game about restoring circular images. A square-cropped picture is displayed inside a circle and split into concentric rings. Each ring has a discrete rotation offset. The player drags rings clockwise or counterclockwise to align the image, but rotating one control ring can rotate multiple visual rings according to a level-specific coupling matrix.

The core puzzle equation is:

```text
current_state = initial_state + A * player_moves mod q
```

Where:

- `n` is the number of rings.
- `q` is the number of discrete rotation ticks.
- `A` is the action-coupling matrix.
- `initial_state` is the scrambled ring offset vector.
- `player_moves` is the accumulated move vector.

The generator must create only valid playable levels. A candidate level becomes playable only after it passes matrix invertibility, solution cost, visible scramble, coupling, inverse entanglement, weighted coupling, and image fairness checks.

## 2. Locked Decisions

- Runtime: mobile-first browser/PWA.
- Renderer: canvas for the circular image puzzle.
- UI: DOM overlays for HUD, menus, settings, coupling map, accessibility-sensitive controls, and text-heavy surfaces.
- Scope: full product design, with implementation sequencing that starts from the core puzzle loop.
- Visual direction: Arcane Rings.
- Generated visual reference: `/Users/chakib/.codex/generated_images/019e892c-3e9e-7f71-b89e-ede3c0d6823a/ig_0a0f721bcd27f683016a1f05cb35a4819187b4d66103e10d2c.png`.
- The generated mock is a preview reference, not a shipped repository asset. If it is later used in-app, copy it into a project asset directory first.

## 3. Experience Pillars

1. Restore the image, not an abstract diagram.
   The puzzle must always feel like image restoration. Good level images have asymmetry, cross-ring features, and enough recognizable detail to make alignment fair.

2. Coupling is readable before it is difficult.
   Hard levels may be mathematically entangled, but the player can inspect coupling rules. The coupling map is not optional for fair advanced play.

3. The playfield stays clear.
   The circular puzzle is the first-viewport focus. Persistent UI is compact, edge-aligned, and never covers the center or lower-middle playfield during normal movement.

4. Difficulty is generated, solved, scored, then accepted.
   Random candidates are not levels. The generator controls hidden solution cost first, computes the scramble from that solution, then rejects anything outside difficulty and fairness bounds.

## 4. Product Flow

The product flow is:

```text
App launch
  -> Main menu
  -> Play / Daily Puzzle / Level Selection / Image Collection / Settings
  -> Puzzle screen
  -> Optional coupling map, reference thumbnail, hint layers, undo, restart
  -> Win screen
  -> Next level, retry, image collection, or menu
```

The first implementation should not build every flow at once. It should start with one playable seeded level and grow into the full product. The final product design still includes all screens listed below.

## 5. Screens

### 5.1 Main Menu

Purpose: give immediate access to the core loop without making the game feel like a dashboard.

Required actions:

- Play: starts the next recommended level.
- Daily puzzle: opens the deterministic daily level.
- Difficulty selection: opens difficulty tracks.
- Image collection: opens unlocked/completed restored images.
- Settings: opens audio, accessibility, input, and persistence settings.

UI direction:

- Arcane Rings title treatment, restrained and compact.
- One primary action, secondary actions below.
- Animated ring motif is acceptable only if it does not become a full-screen loading delay.

### 5.2 Difficulty Selection

Purpose: let players choose the learning curve.

Tracks:

- Beginner
- Easy
- Medium
- Hard
- Expert

Each track shows:

- ring count range
- tick count range
- coupling style
- completed level count
- best star total

### 5.3 Level Selection

Each level card shows:

- thumbnail
- difficulty
- ring count
- tick count
- best stars
- best move count
- whether coupling hints are available

Locked levels should preview their difficulty shape without showing the solution.

### 5.4 Daily Puzzle

The daily puzzle uses a deterministic seed derived from the UTC date plus the difficulty schedule. The same date produces the same candidate pool and accepted level for all players on the same app version.

Daily result stores:

- date key
- level seed
- solved flag
- stars
- best move count
- elapsed time
- hint count

### 5.5 Image Collection

The collection is a gallery of restored images. It should feel like a mystical photo archive, not an inventory grid with heavy chrome.

Each item shows:

- completed image thumbnail
- completion stars
- difficulty badge
- best move count
- date unlocked

### 5.6 Puzzle Screen

Required persistent HUD:

- move counter
- undo button
- hint button
- difficulty badge
- reference thumbnail toggle
- coupling map button when `showCouplingHints` is true

Optional contextual surfaces:

- restart confirmation
- pause menu
- layered hint message
- transient solved feedback before win screen

Playfield rules:

- Keep the center clear.
- Keep lower-middle clear during normal play.
- No full-width top header plus footer layout.
- No large center overlay while dragging.
- Default persistent HUD coverage should stay below roughly 20 percent of the viewport on desktop and should collapse to compact edge chips on mobile.

### 5.7 Coupling Map

Purpose: show how control rings affect visual rings.

The map represents directed edges:

```text
control ring j -> visual ring i when A[i][j] != 0 and i != j
```

Display rules:

- Positive factor: same direction.
- Negative factor: opposite direction.
- Magnitude: label the factor as `x2`, `x-1`, etc.
- Use ring numbers consistently with the puzzle UI.
- The coupling map opens as a drawer or modal and gates puzzle drag input until closed.

Example:

```text
Ring 1 -> Ring 2 x2
Ring 1 -> Ring 3 x-1
Ring 2 -> Ring 4 x2
Ring 4 -> Ring 6 x-2
```

### 5.8 Settings

Settings include:

- reduced motion
- sound effects
- music
- haptic feedback, where supported
- reference thumbnail default
- high-contrast ring borders
- colorblind-friendly coupling signs
- reset progress

Settings overlays must pause or gate puzzle input.

### 5.9 Win Screen

Shows:

- completed image
- stars
- player tick cost
- optimal tick cost
- elapsed time
- hint count
- difficulty score summary
- next level
- retry

The win screen may use a stronger Arcane Rings effect than normal play because the puzzle is no longer interactive.

## 6. Arcane Rings Visual Direction

The UI should feel like a restrained mystical restoration tool:

- Materials: etched metal, glassy translucent panels, fine luminous ring borders.
- Palette: deep charcoal, moonlit blue, muted violet, silver, small amber highlights.
- Typography: readable game UI type with strong numerals; avoid decorative fonts for counters.
- Motion: meaningful state changes only, such as ring selection, affected-ring preview, solved pulse, and hint reveal.
- Controls: icon-led buttons for undo, hint, coupling map, settings, restart, and close actions.

Avoid:

- generic app dashboards
- multi-card body layouts over live play
- large title cards over the puzzle
- one-note purple screens
- permanent control instructions
- decorative blobs or orbs
- excessive motion on every HUD element

## 7. Architecture

### 7.1 Runtime Boundaries

Simulation owns:

- level data
- runtime state
- move application
- undo
- solved detection
- hints
- scoring
- saveable progress

Generation owns:

- coupling matrix creation
- matrix inversion
- hidden solution sampling
- initial scramble computation
- difficulty scoring
- candidate rejection

Image systems own:

- square crop
- image resizing
- ring masks
- symmetry scoring
- cross-ring edge scoring

Renderer owns:

- canvas setup
- image drawing
- annulus clipping
- ring rotations
- borders
- selected and affected highlights
- preview drawing

DOM UI owns:

- HUD
- menus
- drawers
- settings
- coupling map
- win screen
- accessibility labels and focus management

### 7.2 Suggested Module Layout

```text
src/
  math/
    mod.ts
    matrix.ts
    difficulty.ts
  generation/
    levelGenerator.ts
    matrixGenerator.ts
    solutionSampler.ts
  image/
    preprocess.ts
    ringMasks.ts
    quality.ts
  interaction/
    touch.ts
    moves.ts
    inputMap.ts
  render/
    PuzzleCanvas.tsx
    ringRenderer.ts
  state/
    gameState.ts
    progress.ts
    daily.ts
  ui/
    hud/
    screens/
    coupling-map/
```

### 7.3 Input Model

Define actions separately from physical inputs:

```ts
type GameAction =
  | "rotate-preview"
  | "rotate-commit"
  | "undo"
  | "hint"
  | "restart"
  | "pause"
  | "open-coupling-map"
  | "toggle-reference"
  | "confirm"
  | "cancel";
```

Physical mappings:

- Touch drag: ring rotate preview and commit.
- Mouse drag: same as touch for browser testing and desktop play.
- Keyboard:
  - `Escape`: cancel modal, close drawer, or pause.
  - `Z`: undo.
  - `H`: hint.
  - Arrow keys may rotate selected ring in accessibility mode.

Menu, drawer, and modal states must disable puzzle drag input until they close.

## 8. Data Models

### 8.1 Level

```ts
type Level = {
  id: string;
  imageId: string;
  seed: string;
  difficultyName: DifficultyName;
  n: number;
  q: number;
  ringRadii: number[];
  matrix: number[][];
  inverseMatrix: number[][];
  initialOffsets: number[];
  solution: number[];
  difficulty: DifficultyScore;
  showReferenceThumbnail: boolean;
  showCouplingHints: boolean;
};
```

### 8.2 DifficultyScore

```ts
type DifficultyScore = {
  T: number;
  G: number;
  X: number;
  GX: number;
  F: number;
  I: number;
  WF: number;
  WI: number;
  maxOutDegree: number;
  maxInDegree: number;
  graphDepth: number;
};
```

### 8.3 RuntimeState

```ts
type RuntimeState = {
  currentOffsets: number[];
  accumulatedMoves: number[];
  moveHistory: PlayerMove[];
  totalTickMoves: number;
  selectedRing: number | null;
  previewTicks: number;
  isSolved: boolean;
  startedAt: number;
  solvedAt: number | null;
};
```

### 8.4 PlayerMove

```ts
type PlayerMove = {
  controlRing: number;
  deltaTicks: number;
  affectedDelta: number[];
  createdAt: number;
};
```

### 8.5 Progress

```ts
type LevelProgress = {
  levelId: string;
  solved: boolean;
  bestStars: 0 | 1 | 2 | 3;
  bestMoveCount: number | null;
  bestTimeMs: number | null;
  completedAt: string | null;
};

type DailyProgress = {
  dateKey: string;
  levelId: string;
  solved: boolean;
  stars: 0 | 1 | 2 | 3;
  moveCount: number | null;
  timeMs: number | null;
};

type SaveData = {
  schemaVersion: 1;
  settings: UserSettings;
  levelProgress: Record<string, LevelProgress>;
  dailyProgress: Record<string, DailyProgress>;
  unlockedImageIds: string[];
};
```

## 9. Core Math

### 9.1 Modular Normalization

```ts
function modNorm(value: number, q: number): number {
  return ((value % q) + q) % q;
}
```

### 9.2 Cyclic Distance

```ts
function cyclicDistance(value: number, q: number): number {
  const x = modNorm(value, q);
  return Math.min(x, q - x);
}
```

### 9.3 Matrix and Vector Multiplication

```ts
function matVecMod(matrix: number[][], vector: number[], q: number): number[] {
  return matrix.map((row) => {
    const total = row.reduce((sum, value, j) => sum + value * vector[j], 0);
    return modNorm(total, q);
  });
}

function matMulMod(a: number[][], b: number[][], q: number): number[][] {
  const rows = a.length;
  const cols = b[0].length;
  const inner = b.length;

  return Array.from({ length: rows }, (_, i) =>
    Array.from({ length: cols }, (_, j) => {
      let total = 0;
      for (let k = 0; k < inner; k += 1) {
        total += a[i][k] * b[k][j];
      }
      return modNorm(total, q);
    })
  );
}
```

### 9.4 Unit Lower-Triangular Inverse

V1 matrices use `A = I + N`, where `N` is lower triangular. The diagonal is always `1`, so no modular division is required and the matrix is invertible modulo any `q`.

```ts
function inverseUnitLowerTriangular(matrix: number[][], q: number): number[][] {
  const n = matrix.length;
  const inverse = Array.from({ length: n }, () => Array(n).fill(0));

  for (let col = 0; col < n; col += 1) {
    for (let i = 0; i < n; i += 1) {
      let value = i === col ? 1 : 0;
      for (let k = 0; k < i; k += 1) {
        value -= matrix[i][k] * inverse[k][col];
      }
      inverse[i][col] = modNorm(value, q);
    }
  }

  return inverse;
}
```

## 10. Difficulty Model

Difficulty is multi-dimensional. One score is not enough.

Metrics:

- `T`: solution tick cost, `sum(cyclicDistance(u_i, q))`.
- `G`: active solution rings, count of nonzero `u_i`.
- `X`: visible scramble cost, `sum(cyclicDistance(x0_i, q))`.
- `GX`: visibly scrambled rings, count of nonzero `x0_i`.
- `F`: direct coupling count, nonzero off-diagonal entries in `A`.
- `I`: inverse entanglement count, nonzero off-diagonal entries in `A^-1`.
- `WF`: weighted direct coupling, `sum(cyclicDistance(A_ij, q))` for off-diagonal entries.
- `WI`: weighted inverse coupling, same as `WF` but for `A^-1`.
- `maxOutDegree`: maximum number of visual rings affected by one control ring.
- `maxInDegree`: maximum number of control rings affecting one visual ring.
- `graphDepth`: longest directed dependency chain in the triangular coupling graph.

### 10.1 Difficulty Profiles

```ts
type DifficultyName = "beginner" | "easy" | "medium" | "hard" | "expert";

type DifficultyConfig = {
  n: number;
  q: number;
  factorSet: number[];
  minEdges: number;
  maxEdges: number;
  maxOutDegree: number;
  bounds: Record<keyof DifficultyScore, [number, number]>;
};
```

Recommended starting profiles:

| Difficulty | Rings | Ticks | Topology | Notes |
| --- | ---: | ---: | --- | --- |
| Beginner | 3 | 8 | identity or simple chain | Teaches ring alignment. |
| Easy | 4 | 8 or 12 | chain or light branch | Adds small coupling. |
| Medium | 5 | 12 | branching DAG | Introduces entanglement. |
| Hard | 6 | 12 | bounded dense DAG | Requires coupling map use. |
| Expert | 7 to 8 | 12 or 16 | dense branching DAG | Ship only after tuning. |

Hard profile target:

```ts
const HARD_CONFIG: DifficultyConfig = {
  n: 6,
  q: 12,
  factorSet: [-3, -2, -1, 1, 2, 3],
  minEdges: 8,
  maxEdges: 12,
  maxOutDegree: 3,
  bounds: {
    T: [22, 28],
    G: [5, 6],
    X: [18, 32],
    GX: [5, 6],
    F: [8, 12],
    I: [10, 14],
    WF: [18, 35],
    WI: [25, 55],
    maxOutDegree: [1, 3],
    maxInDegree: [0, 5],
    graphDepth: [3, 5],
  },
};
```

## 11. Level Generation

### 11.1 Acceptance Rule

```text
accept(level) =
  A is invertible mod q
  AND T_min <= T(u) <= T_max
  AND G_min <= G(u) <= G_max
  AND X_min <= X(x0) <= X_max
  AND GX_min <= GX(x0) <= GX_max
  AND F_min <= F(A) <= F_max
  AND I_min <= I(B) <= I_max
  AND WF_min <= WF(A) <= WF_max
  AND WI_min <= WI(B) <= WI_max
  AND image_symmetry_score <= threshold
  AND boundary_edge_score >= threshold
```

### 11.2 Solution-First Algorithm

Do not generate `x0` randomly and solve backward. Generate the hidden solution inside bounds first, then compute the visible scramble.

```text
1. Generate triangular matrix A.
2. Compute B = A^-1 mod q.
3. Generate hidden solution u inside T and G bounds.
4. Compute x0 = -A * u mod q.
5. Score A, B, u, and x0.
6. Reject candidate unless all difficulty bounds pass.
7. Reject candidate unless image fairness checks pass.
8. Return accepted level.
```

### 11.3 Triangular Matrix Generation

```ts
function generateTriangularMatrix(config: DifficultyConfig, rng: Rng): number[][] {
  const { n, factorSet, minEdges, maxEdges, maxOutDegree } = config;
  const matrix = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))
  );

  const possibleEdges: Array<[number, number]> = [];
  for (let control = 0; control < n; control += 1) {
    for (let visual = control + 1; visual < n; visual += 1) {
      possibleEdges.push([visual, control]);
    }
  }

  rng.shuffle(possibleEdges);
  const targetEdges = rng.int(minEdges, maxEdges);
  const outDegree = Array(n).fill(0);
  let added = 0;

  for (const [visual, control] of possibleEdges) {
    if (added >= targetEdges) break;
    if (outDegree[control] >= maxOutDegree) continue;
    matrix[visual][control] = rng.pick(factorSet);
    outDegree[control] += 1;
    added += 1;
  }

  return matrix;
}
```

### 11.4 Solution Sampling

Sample distances first, then convert them into signed modular moves.

```text
1. Pick T_target inside [T_min, T_max].
2. Distribute T_target across n rings with each distance <= floor(q / 2).
3. Reject unless active ring count G is inside bounds.
4. Convert each nonzero distance to either +r or -r modulo q.
```

### 11.5 Minimal Hard Example

```text
n = 6
q = 12

A =
[  1   0   0   0   0   0 ]
[  2   1   0   0   0   0 ]
[ -1   0   1   0   0   0 ]
[  0   2  -1   1   0   0 ]
[  0   0   2  -2   1   0 ]
[  0   1   0   2  -1   1 ]

u = [5, 8, 6, 3, 10, 4]
T = 24
x0 = [7, 6, 11, 11, 8, 4]
```

Validation:

```text
x0 + A * u = 0 mod 12
```

## 12. Runtime Movement

### 12.1 Move Application

When the player rotates control ring `j` by `deltaTicks`:

```ts
function applyPlayerMove(
  state: RuntimeState,
  matrix: number[][],
  controlRing: number,
  deltaTicks: number,
  q: number,
  now: number
): RuntimeState {
  const affectedDelta = matrix.map((row) => modNorm(row[controlRing] * deltaTicks, q));
  const currentOffsets = state.currentOffsets.map((offset, i) =>
    modNorm(offset + matrix[i][controlRing] * deltaTicks, q)
  );

  const accumulatedMoves = [...state.accumulatedMoves];
  accumulatedMoves[controlRing] = modNorm(
    accumulatedMoves[controlRing] + deltaTicks,
    q
  );

  const move: PlayerMove = {
    controlRing,
    deltaTicks,
    affectedDelta,
    createdAt: now,
  };

  return {
    ...state,
    currentOffsets,
    accumulatedMoves,
    moveHistory: [...state.moveHistory, move],
    totalTickMoves: state.totalTickMoves + Math.abs(deltaTicks),
    isSolved: currentOffsets.every((value) => modNorm(value, q) === 0),
  };
}
```

### 12.2 Undo

Undo applies the opposite of the last committed move and removes that move from history. It should not count as a new player tick cost.

### 12.3 Preview

During drag, do not mutate committed runtime state. Compute a preview vector:

```ts
function computePreviewOffsets(
  currentOffsets: number[],
  matrix: number[][],
  controlRing: number,
  previewTicks: number,
  q: number
): number[] {
  return currentOffsets.map((offset, i) =>
    modNorm(offset + matrix[i][controlRing] * previewTicks, q)
  );
}
```

Preview must highlight:

- selected control ring
- affected rings
- direction and magnitude through subtle visual feedback

Without preview, advanced coupling feels arbitrary.

## 13. Touch and Pointer Handling

### 13.1 Ring Selection

Given pointer position `(px, py)` and puzzle center `(cx, cy)`, select the ring whose radius interval contains the pointer radius.

```ts
function findRingFromPoint(
  px: number,
  py: number,
  cx: number,
  cy: number,
  ringRadii: number[]
): number | null {
  const dx = px - cx;
  const dy = py - cy;
  const radius = Math.sqrt(dx * dx + dy * dy);

  for (let i = 0; i < ringRadii.length - 1; i += 1) {
    if (ringRadii[i] <= radius && radius < ringRadii[i + 1]) {
      return i;
    }
  }

  return null;
}
```

### 13.2 Drag To Ticks

```ts
function angleOfPoint(px: number, py: number, cx: number, cy: number): number {
  return Math.atan2(py - cy, px - cx);
}

function unwrapAngleDelta(startAngle: number, currentAngle: number): number {
  let delta = currentAngle - startAngle;
  while (delta <= -Math.PI) delta += 2 * Math.PI;
  while (delta > Math.PI) delta -= 2 * Math.PI;
  return delta;
}

function angleDeltaToTicks(deltaAngle: number, q: number): number {
  const tickAngle = (2 * Math.PI) / q;
  return Math.round(deltaAngle / tickAngle);
}
```

Drag lifecycle:

```text
pointerdown -> select ring, store start angle
pointermove -> compute preview ticks
pointerup -> commit nonzero preview ticks
cancel/blur/modal open -> clear selected ring and preview
```

## 14. Rendering

### 14.1 Ring Renderer

For each animation frame:

```text
clear canvas
for each ring i:
  save context
  apply annulus clip
  translate to center
  rotate by currentOffsets[i] * 2pi / q
  draw square-cropped image centered
  restore context
draw subtle ring borders
draw selected ring highlight
draw affected ring highlights
```

Do not crop and rotate bitmap pieces every frame. Use canvas clipping masks and transforms.

### 14.2 Ring Radii

V1 may use equal-width rings for early implementation. Product-quality levels should use balanced radii:

```ts
function balancedRingRadii(radius: number, n: number, power = 0.85): number[] {
  return Array.from({ length: n + 1 }, (_, i) => radius * (i / n) ** power);
}
```

This gives inner rings more area and improves touch usability.

## 15. Image Handling and Fairness

### 15.1 Square Crop

The puzzle uses a square crop before circular rendering:

```ts
function centerSquareCrop(width: number, height: number) {
  const size = Math.min(width, height);
  return {
    left: Math.floor((width - size) / 2),
    top: Math.floor((height - size) / 2),
    size,
  };
}
```

### 15.2 Good Images

Prefer:

- faces
- characters
- architecture
- landscapes with horizon lines
- asymmetric scenes
- images with visual features crossing ring boundaries

Reject or downgrade:

- radial mandalas
- plain skies
- water textures
- symmetric logos
- repeated circular ornaments

### 15.3 Symmetry Check

For each ring, compare the ring to rotated versions of itself. Reject images or force reference thumbnail support when a nonzero rotation has high similarity.

Initial threshold:

```text
max rotated ring similarity <= 0.92
```

This threshold should be tuned during playtesting.

### 15.4 Cross-Ring Edge Check

For each boundary between rings:

```text
sample pixels near boundary
estimate average gradient magnitude
count boundaries with meaningful edge signal
reject images where most boundaries are weak
```

This prevents levels where each ring looks independent and alignment becomes guesswork.

## 16. Hint System

The generator knows the hidden solution `u`. Runtime stores accumulated moves `m`. The remaining correction is:

```text
remaining = u - m mod q
```

Pick the ring with the largest remaining cyclic distance.

Hint layers:

1. Light: highlight the ring that still needs the most correction.
2. Medium: state that the ring still needs adjustment.
3. Strong: show the shortest signed move, such as "Ring 3 counterclockwise 2 ticks."

Hard mode should avoid showing the exact move immediately. The hint button can advance hint strength per level attempt.

## 17. Star Scoring

Let:

- `T` be the optimal tick cost from the hidden solution.
- `P` be the player's total absolute committed tick cost.

Scoring:

```ts
function computeStars(optimalCost: number, playerCost: number): 1 | 2 | 3 {
  if (playerCost <= Math.ceil(1.1 * optimalCost)) return 3;
  if (playerCost <= Math.ceil(1.4 * optimalCost)) return 2;
  return 1;
}
```

Store best result per level. Hints may be shown on the win screen but should not reduce stars in V1 unless playtesting shows abuse.

## 18. Progression

Stage 1: Independent rings.

- `A = identity`
- Teaches image restoration and ring snapping.

Stage 2: Neighbor coupling.

- Ring `i` affects ring `i + 1`.
- Factors: `+1`.

Stage 3: Opposite direction coupling.

- Introduces negative factors.
- Factors: `-1`.

Stage 4: Stronger factors.

- Factors: `+2`, `-2`.

Stage 5: Branching coupling.

- One control ring affects multiple later visual rings.

Stage 6: Hard DAGs.

- Dense but bounded triangular matrices.
- Coupling map becomes central to fair play.

Do not start product tuning with expert mode. Build and tune around `n = 4, 5, 6` and `q = 12`.

## 19. Persistence

Use local browser persistence for V1:

- settings
- level progress
- daily progress
- unlocked image collection

Persistence requirements:

- version the save schema
- tolerate missing or partial records
- provide reset progress in settings
- never persist renderer objects or canvas state
- persist serializable simulation and progress state only

## 20. PWA Requirements

The PWA should support:

- installable manifest
- offline shell
- cached level metadata and image assets
- responsive portrait-first layout
- safe-area insets on mobile
- pointer input for Playwright and desktop testing
- touch input for mobile play

The puzzle screen must remain usable on common phone viewport sizes before desktop polish.

## 21. Implementation Sequence

Build in this order:

1. Static circular image split into rings.
2. Independent ring rotation with snapping.
3. State vector and solved detection.
4. Action-coupling matrix `A`.
5. Matrix-based move update.
6. Deterministic level generator with identity matrix.
7. Triangular matrix generator.
8. Solution-first scrambling.
9. Difficulty scoring and rejection sampling.
10. Hint system.
11. Coupling map.
12. Image fairness checks.
13. Progression and level packs.
14. Daily puzzle.
15. Image collection.
16. Settings and persistence hardening.

## 22. Validation Strategy

### 22.1 Unit and Property Tests

Math:

- `modNorm` handles negative and positive values.
- `cyclicDistance` returns the shortest distance for all ticks.
- `matVecMod` and `matMulMod` normalize results.
- `inverseUnitLowerTriangular(A, q)` satisfies `A * B = I mod q`.

Generator:

- generated matrices have diagonal `1`.
- generated matrices are lower triangular in V1.
- generated levels are not initially solved.
- hidden solution solves the initial state.
- difficulty scores fit configured bounds.
- inverse validation proves unique net solution.

Runtime:

- applying a move updates all affected rings.
- negative delta ticks work.
- preview does not mutate committed state.
- undo restores previous offsets and accumulated move state.
- solved detection fires after the final correction.

Image:

- center square crop is correct for landscape, portrait, and square images.
- ring radii length is `n + 1`.
- symmetry and edge scores reject known bad fixtures.

### 22.2 Playwright Acceptance Coverage

Because this is a web interface, browser validation must use Playwright once implementation begins.

Required scenarios:

- first-load menu flow
- start generated level
- rotate a ring with pointer input
- preview appears before commit
- undo restores the previous visual state
- hint opens and advances through layers
- coupling map opens and closes without corrupting input state
- known seeded level can be completed
- win screen shows stars, move count, optimal cost, and next-level action
- mobile viewport keeps puzzle center and lower-middle playfield clear

### 22.3 Visual QA

For the Arcane Rings direction, screenshots should verify:

- the puzzle remains the first visual focus
- HUD clusters stay compact
- selected and affected rings are legible
- overlays are readable over motion
- menus gate puzzle input
- reduced-motion setting disables nonessential animation

## 23. Implementation Defaults

- Prefer well-known open-source libraries when they reduce meaningful complexity.
- Do not add a heavy game engine for V1; canvas plus DOM is sufficient for this 2D puzzle.
- Use a deterministic seeded RNG library instead of ad hoc randomness.
- Use property-based testing for generator invariants if the chosen test stack supports it.
- Keep generated assets and candidate level data out of source control unless they are explicit fixtures.
- Use browser-native pointer events for unified touch, mouse, and Playwright coverage.

## 24. Open Tuning Items

These are intentionally left for playtesting, not implementer invention:

- exact image symmetry threshold after fixture testing
- exact boundary edge threshold
- whether hints affect stars
- final Expert profile bounds
- daily puzzle difficulty schedule
- audio and haptic intensity

The implementation should expose these as configuration values rather than hard-coded scattered constants.
