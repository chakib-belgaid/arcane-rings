# Project Circles Closeout Backlog

## Active Closeout Batch

| Severity | Area | User-visible symptom | Fix | Verification |
| --- | --- | --- | --- | --- |
| high | `src/render/PuzzleCanvas.tsx` | Ring rotations snap too abruptly after moves. | Add renderer-side visual interpolation toward gameplay offsets while keeping reducer state authoritative. | Completed: Playwright drag/keyboard move flow plus video demo. |
| high | `src/ui/App.tsx` | Reference thumbnail stays small and does not open a window. | Add a reference modal/sheet opened by the thumbnail. | Completed: Playwright opens Ref and checks dialog image. |
| high | `src/ui/App.tsx` / `src/game/gameState.ts` | Hint button only increments a counter and broad coupling UI is always exposed. | Hide coupling map on hard levels; use Hint to reveal one actionable coupling relation. | Completed: Playwright verifies no Map/Coupling button on hard, Hint opens one-coupling dialog. |
| medium | Demo artifact | No single proof artifact for the closed product. | Generate a short Playwright-recorded video showing the fixed flows. | Completed: saved `.webm` demo. |

## Stop Criteria

| Criterion | Status |
| --- | --- |
| Main game flow works from menu to puzzle | complete |
| Reference popup opens and renders image | complete |
| Hint reveals one coupling only | complete |
| Coupling map hidden for hard mode | complete |
| Rotation has smooth visual interpolation | complete |
| Unit tests, build, browser suite pass | complete |
| Video demo generated | complete |
