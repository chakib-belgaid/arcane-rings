# Project Circles Polish Backlog

Created: 2026-06-03

## Audit Evidence

- `/opt/homebrew/bin/bun install --frozen-lockfile` completed successfully.
- `/opt/homebrew/bin/bun run typecheck` passed.
- `/opt/homebrew/bin/bun run build` passed.
- `/opt/homebrew/bin/bun run playwright` passed: 23 passed, 3 skipped.
- One-off Playwright console audit passed with no browser console errors across menu, puzzle, settings, coupling map, and image selection.
- `/opt/homebrew/bin/bun test` failed and is tracked below as closeout work.
- Screenshots reviewed: `output/playwright/desktop-puzzle-flow.png`, `output/playwright/mobile-puzzle-flow.png`, `output/playwright/mobile-clear-playfield.png`.

## Closeout Batches

1. Blocker and high-severity interactions
2. Mobile and responsive polish
3. Missing loading, empty, error, success, disabled, selected, and active states
4. Motion and micro-interactions
5. Performance and asset cleanup
6. Verification and test-harness hardening

## Backlog Items

### PC-001: Remove the production cheat-complete path

- Severity: blocker
- File or component: `src/ui/hud/PuzzleHud.tsx`, `src/ui/screens/PuzzleScreen.tsx`, `src/App.tsx`, `tests/e2e/menu-hud-overlays.pw.ts`
- User-visible symptom: The trophy button labeled "Complete fixture level" is visible in the production HUD and completes the level immediately, even with zero moves.
- Proposed fix: Hide this control outside test/dev mode and complete the puzzle from real solved-state detection after committed ring rotations. If solved-state completion is not ready, remove the button from normal UI and keep a test-only hook behind an explicit fixture flag.
- Verification method: Run `/opt/homebrew/bin/bun run playwright`; add/update a Playwright test that no button named "Complete fixture level" is visible in the production app and that completion only appears after a valid solve path.

### PC-002: Start puzzles in a real scrambled state

- Severity: blocker
- File or component: `src/ui/screens/PuzzleScreen.tsx`, `src/ui/fixtureData.ts`, `src/generation/*`, `src/math/*`
- User-visible symptom: The current puzzle starts visually restored because all ring offsets initialize to `0`, so the main game loop does not feel playable.
- Proposed fix: Initialize each level with deterministic scrambled offsets derived from the selected level or daily seed, preserve the target solution, and mark the level complete only when normalized offsets return to the target.
- Verification method: Add unit coverage for initial offsets and solved detection; update Playwright to assert the initial canvas host offsets are not all zero, then solve or use a fixture-level known solution.

### PC-003: Implement or intentionally disable Undo

- Severity: high
- File or component: `src/ui/hud/PuzzleHud.tsx`, `src/ui/screens/PuzzleScreen.tsx`
- User-visible symptom: The Undo HUD control is clickable but `onUndo={() => undefined}`, so it gives no feedback and never reverts a move.
- Proposed fix: Track a move history stack in `PuzzleScreen`, revert offsets, move count, and tick cost on undo, and disable the button with a clear disabled state when history is empty.
- Verification method: Unit test one and multiple undo steps; Playwright drag a ring, click Undo, and assert offsets plus movement counters return to the previous values.

### PC-004: Close the misleading Next Level action

- Severity: high
- File or component: `src/ui/screens/WinScreen.tsx`, `src/App.tsx`, `src/ui/fixtureData.ts`
- User-visible symptom: "Next level" starts the same fixture again because there is no real progression path.
- Proposed fix: Either implement next unlocked level selection from `levelCards`, or rename/replace the action with "Play again" until progression exists. Do not leave a forward-progression label that loops the player.
- Verification method: Playwright complete a level, click the primary win action, and assert the next screen/action matches the visible label.

### PC-005: Finish or gate settings footer actions

- Severity: high
- File or component: `src/ui/screens/SettingsOverlay.tsx`
- User-visible symptom: "Preview sound effects", "Preview haptic feedback", "Restore defaults", and "Reset progress" are clickable but have no handlers or result feedback.
- Proposed fix: Implement restore defaults and reset progress with confirmation/success feedback. Disable or hide sound/haptic preview until audio/haptic systems exist, or wire them to real preview behavior.
- Verification method: Component tests for reset/default state changes; Playwright open settings and assert each visible footer control either changes state, shows feedback, or is disabled with an accessible reason.

### PC-006: Persist and apply settings toggles

- Severity: high
- File or component: `src/ui/screens/SettingsOverlay.tsx`, `src/App.tsx`, `src/styles.css`, `src/render/PuzzleCanvas.tsx`
- User-visible symptom: Settings toggles reset when the overlay is closed and most toggles do not visibly affect the app.
- Proposed fix: Lift settings into app-level state, persist to `localStorage`, and apply at least reduced motion, reference thumbnail default, high contrast ring borders, and colorblind-friendly coupling signs. Disable unavailable sound/music/haptics until systems exist.
- Verification method: Unit test persistence and default restoration; Playwright toggle settings, close/reopen, reload, and assert state plus visible CSS or canvas behavior is retained.

### PC-007: Add empty states for unavailable difficulty tracks

- Severity: medium
- File or component: `src/ui/screens/DifficultySelection.tsx`, `src/ui/screens/LevelSelection.tsx`, `src/ui/fixtureData.ts`
- User-visible symptom: Beginner, Easy, Hard, and Expert tracks can be opened, but they render an empty levels screen because only the medium track has cards.
- Proposed fix: Either disable tracks without level cards or show a clear empty state with a back action and the available playable track. Keep the scope narrow; do not invent new levels just to fill the page.
- Verification method: Playwright click every difficulty track and assert the result is either playable cards or an intentional empty/disabled state with no blank page.

### PC-008: Make Daily Puzzle distinct or intentionally label it

- Severity: medium
- File or component: `src/App.tsx`, `src/ui/screens/MainMenu.tsx`, `src/generation/*`
- User-visible symptom: "Daily puzzle" starts the same fixture path as "Play", so the menu promises a mode that does not exist.
- Proposed fix: Generate a deterministic daily level from the current date, or relabel/disable the button until daily generation is ready.
- Verification method: Playwright click Daily Puzzle and assert a daily seed/date marker or an intentionally disabled state; unit test date-to-seed behavior if implemented.

### PC-009: Replace static hints with state-aware hint feedback

- Severity: medium
- File or component: `src/ui/screens/PuzzleScreen.tsx`, `src/ui/hud/PuzzleHud.tsx`
- User-visible symptom: The hint button always shows "Ring 3 still needs adjustment" and does not explain when hints are exhausted or unnecessary.
- Proposed fix: Derive hint copy from current offsets and solution state, expose escalating hint layers, disable the hint button when no hint is available, and show a short success/error state after each hint request.
- Verification method: Unit test hint selection from offset deltas; Playwright click Hint repeatedly and assert light, medium, strong, and exhausted states.

### PC-010: Add selected and active states to HUD toggles

- Severity: medium
- File or component: `src/ui/hud/PuzzleHud.tsx`, `src/ui/components/IconButton.tsx`, `src/styles.css`
- User-visible symptom: Toggle-style HUD buttons such as reference visibility and coupling map do not show selected/open state, making it hard to tell what is active from the icon-only rail.
- Proposed fix: Extend `IconButton` to support `aria-pressed` or active state styling, use it for reference visibility, and add tooltips/titles for icon-only controls.
- Verification method: Component tests assert `aria-pressed`; Playwright toggle reference and inspect button state plus visual active class.

### PC-011: Add upload loading and success feedback

- Severity: medium
- File or component: `src/ui/screens/ImageCollection.tsx`
- User-visible symptom: Image upload has invalid-file and read-error copy, but no loading, disabled, or success state while a file is being read.
- Proposed fix: Track `isUploading`, disable upload/play controls while reading, show a compact loading indicator, and show a dismissible success message when the uploaded image is selected.
- Verification method: Component test with a delayed `FileReader`; Playwright upload a valid file and assert success feedback and selected state.

### PC-012: Fix modal focus containment

- Severity: medium
- File or component: `src/ui/components/ModalShell.tsx`, `src/ui/screens/WinScreen.tsx`
- User-visible symptom: Modals focus the close button and support Escape, but focus is not trapped inside the dialog, so keyboard users can tab into controls behind the overlay.
- Proposed fix: Add a small focus-trap implementation or a well-known lightweight focus-trap library if the dependency weight is justified. Apply it to settings, coupling map, solution reference, and win dialogs.
- Verification method: Playwright open each dialog, press Tab repeatedly, and assert focus remains inside the dialog; press Escape and assert focus returns to the invoking control.

### PC-013: Tighten mobile vertical composition

- Severity: medium
- File or component: `src/styles.css`, `src/ui/screens/PuzzleScreen.tsx`
- User-visible symptom: Mobile screenshots pass overflow/tap checks but leave a large empty band between the puzzle and fixed HUD, making the game feel visually disconnected.
- Proposed fix: Rebalance mobile puzzle layout with viewport-aware canvas sizing and HUD spacing. Keep the protected playfield clear, but reduce dead vertical space around 390px width.
- Verification method: Run `/opt/homebrew/bin/bun run playwright`; review updated `mobile-puzzle-flow.png` and `mobile-clear-playfield.png` at about 390px width.

### PC-014: Respect reduced motion consistently

- Severity: medium
- File or component: `src/styles.css`, `src/ui/screens/SettingsOverlay.tsx`, `src/render/PuzzleCanvas.tsx`
- User-visible symptom: CSS animations are present, but the user-facing Reduced motion toggle does not apply to the app and there is no global `prefers-reduced-motion` fallback.
- Proposed fix: Add a CSS reduced-motion media query and app-level setting class/data attribute that disables nonessential animations and shortens canvas settle transitions.
- Verification method: Unit/component test for setting propagation; Playwright emulate reduced motion and assert animated elements have reduced/zero transition duration.

### PC-015: Clean up test command ownership

- Severity: high
- File or component: `package.json`, `vite.config.ts`, `tests/render/PuzzleCanvas.test.tsx`, `tests/e2e/project-circles*.spec.ts`
- User-visible symptom: `/opt/homebrew/bin/bun test` fails even though product Playwright passes. Bun collects Playwright spec files and `vi.mocked` is unavailable in the current Bun/Vitest path.
- Proposed fix: Route unit tests through `vitest run` or constrain Bun test discovery to Bun-compatible tests. Move Playwright specs outside Bun's test match, rename spec files, or update scripts so `bun test` only runs unit tests. Replace `vi.mocked` with a compatible typed cast or ensure Vitest owns that test.
- Verification method: `/opt/homebrew/bin/bun test` exits 0, `/opt/homebrew/bin/bun run playwright` exits 0, and CI scripts call the intended runners explicitly.

### PC-016: Fix jsdom image upload unit coverage

- Severity: medium
- File or component: `tests/ui-app.test.tsx`, `src/ui/screens/ImageCollection.tsx`
- User-visible symptom: The image upload unit test fails with `FileReader.readAsDataURL` receiving a non-jsdom Blob, even though the browser-level upload test passes.
- Proposed fix: Create test files using the active jsdom `File` constructor or stub `FileReader` in the unit test. Keep the production browser behavior unchanged unless a real upload bug is reproduced.
- Verification method: The "selects default presets and uploaded images for play" unit test passes under the chosen unit runner, and the existing Playwright upload test still passes.

### PC-017: Add no-console-errors smoke coverage

- Severity: low
- File or component: `tests/playwright/app-shell.pw.ts`, `tests/e2e/menu-hud-overlays.pw.ts`
- User-visible symptom: Manual audit found no console errors, but the automated Playwright suite does not fail on future console regressions.
- Proposed fix: Add a shared Playwright fixture/helper that records `console.error` and `pageerror` events, then asserts none were emitted for smoke flows.
- Verification method: Introduce the helper in existing smoke tests and run `/opt/homebrew/bin/bun run playwright`.

## Stop Criteria For This Backlog

- No production-visible debug completion button remains.
- Puzzles start scrambled, can be solved, and complete through the game loop.
- Every visible primary control works or is intentionally disabled/hidden.
- Settings either persist/apply or unavailable controls are disabled.
- Empty difficulty routes and daily mode are no longer misleading.
- Mobile 390px and desktop 1440px layouts remain usable with no horizontal overflow.
- Loading/error/success/disabled/selected states are present on main flows.
- Basic motion respects reduced-motion preferences.
- `/opt/homebrew/bin/bun run typecheck`, `/opt/homebrew/bin/bun test`, `/opt/homebrew/bin/bun run build`, and `/opt/homebrew/bin/bun run playwright` pass, or any remaining failures are documented as non-blocking.
