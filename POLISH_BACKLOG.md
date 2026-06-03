# Project Circles Polish Backlog

Closer pass started on 2026-06-03. Scope is limited to finishing existing visible surfaces; no new game modes or broad redesign.

## Batch 1 - Dead Controls And State Feedback

| Status | Severity | File / Component | User-visible symptom | Proposed fix | Verification |
| --- | --- | --- | --- | --- | --- |
| completed | high | `src/ui/screens/PuzzleScreen.tsx`, `src/ui/hud/PuzzleHud.tsx` | Undo is clickable but does nothing, and it is enabled before any move. | Track committed move history, disable Undo until a move exists, and restore offsets/move/tick counts on undo. | Vitest UI flow and Playwright drag/undo smoke passed. |
| completed | high | `src/ui/screens/SettingsOverlay.tsx`, `src/App.tsx` | Settings preview/default/reset controls are clickable with no feedback. | Implement visible feedback, default restoration, and two-step progress reset that clears stored best scores. | Vitest settings flow and Playwright overlay smoke passed. |
| completed | high | `src/ui/hud/PuzzleHud.tsx` | Fixture completion shortcut is exposed as a production HUD control. | Hide the shortcut unless the app is in test mode or opened with explicit fixture controls. | Playwright normal app asserts the shortcut is absent; fixture-control tests still cover win screen. |
| completed | medium | `src/ui/screens/SettingsOverlay.tsx`, `src/App.tsx` | Settings toggles reset after reopening and only affect local modal state. | Persist settings in localStorage and apply supported visual/input settings. | Vitest close/reopen persistence checks passed. |
| completed | medium | `src/ui/screens/PuzzleScreen.tsx`, `src/ui/hud/PuzzleHud.tsx` | Hint feedback is generic and the reference toggle has no selected/pressed state. | Add bounded hint layers, disable exhausted hints, and expose `aria-pressed` for reference visibility. | Vitest and Playwright HUD interaction checks passed. |
| completed | low | `src/ui/screens/ImageCollection.tsx` | Upload has error text but no loading or success feedback, and actions remain active while reading. | Track reading/success/error states, disable conflicting actions, and expose status/alert messages. | Vitest upload flow passed. |

## Batch 2 - Responsive And Visual Polish

| Status | Severity | File / Component | User-visible symptom | Proposed fix | Verification |
| --- | --- | --- | --- | --- | --- |
| completed | high | `src/styles.css`, `PuzzleHud` | Tablet HUD compresses enough for controls to overlap or intercept each other. | Let the dock size to content up to the viewport and extend wrapping behavior through tablet widths. | Playwright at 768px validates HUD button centers are not intercepted. |
| completed | medium | `src/styles.css`, `WinScreen.tsx` | Mobile win dialog pushes primary actions below the first viewport. | Shrink decorative win art and keep actions visible earlier on small screens. | Playwright mobile win-screen action geometry passed. |
| completed | medium | `src/styles.css`, `ImageCollection.tsx` | Mobile collection selection checkmark reads as a loose bottom row. | Anchor selection state top-right on mobile cards. | Playwright mobile collection flow passed. |
| completed | low | `src/styles.css`, modal surfaces | Modal backdrops leave gated puzzle controls too visually prominent underneath. | Increase backdrop depth and blur/dim background chrome while dialogs are open. | Playwright overlay screenshots regenerated without failures. |
| completed | low | `src/styles.css`, `SettingsOverlay.tsx` | Toggle rows lack row-level hover/focus/checked polish. | Add hover, focus-within, and checked row states using existing tokens. | Settings interaction tests passed. |

## Batch 3 - Navigation Honesty And Empty States

| Status | Severity | File / Component | User-visible symptom | Proposed fix | Verification |
| --- | --- | --- | --- | --- | --- |
| completed | high | `src/ui/screens/WinScreen.tsx`, `src/App.tsx` | Next level restarts the same fixture while promising progression. | Relabel the action as replay when no next level exists. | Vitest win-screen assertion and Playwright win action smoke passed. |
| completed | medium | `src/ui/screens/MainMenu.tsx`, `src/App.tsx` | Daily puzzle starts the same puzzle as Play with no daily state. | Disable Daily until a real daily seed exists. | Vitest menu assertion passed. |
| completed | medium | `src/ui/screens/LevelSelection.tsx` | Non-medium tracks open blank pages because no level cards exist. | Add an explicit empty state with a route back to difficulty. | Vitest difficulty flow and Playwright responsive navigation passed. |

## Batch 4 - Verification And Documentation

| Status | Severity | File / Component | User-visible symptom | Proposed fix | Verification |
| --- | --- | --- | --- | --- | --- |
| completed | high | `README.md`, `docs/app-shell-integration.md` | Docs tell contributors to run `bun test`, which invokes Bun's native runner and fails for this repo. | Document `/opt/homebrew/bin/bun run test` for Vitest. | `rg "bun test"` confirms no stale command remains in docs. |
| completed | medium | `tests/e2e/README.md` | Fixture harness docs describe an old default target and ignored base URL flow. | Update docs for current built-app default and `playwright:fixture`. | Docs review plus Playwright app and fixture suites passed. |
| completed | medium | `tests/e2e/menu-hud-overlays.pw.ts`, `e2e/puzzleCanvas.pw.ts` | Win and HUD actions are mostly checked for visibility, so regressions could pass. | Extend browser smoke coverage for replay/menu/reset, undo, and reference toggle behavior. | Targeted Playwright files and full Playwright suite passed. |

## Remaining Non-blocking Watchlist

- Production completion still depends on the broader generated-level runtime integration. This closer pass removes the visible fixture shortcut from normal app use instead of inventing a full campaign system.
- Playwright currently emits non-blocking Node/runtime warnings for `module.register()` and `NO_COLOR`/`FORCE_COLOR`.
