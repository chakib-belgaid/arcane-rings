# Test Log

## 2026-06-05 - CI/CD and GitHub Pages setup

- `bun install --frozen-lockfile` - passed.
- `bun run typecheck` - passed.
- `bun run test` - passed: 18 files, 73 tests.
- `bun run build` - passed.
- `bun run build:pages` - passed with `VITE_BASE_PATH=/arcane-rings/`.
- `rg -n '["(]/assets|"/sw\.js|"/manifest|"/icons|"/brand' dist` - passed with no bare root deploy paths after the Pages build.
- `bun run test:e2e:mobile` - first sandbox run failed because the preview server could not bind `127.0.0.1:4173`; approved rerun passed: 13 passed, 1 skipped.
- `bun run test:e2e:mobile:fixture` - first sandbox run failed because the fixture server could not bind `127.0.0.1:4175`; approved rerun passed: 7 passed.
- Base-aware local preview with `VITE_BASE_PATH=/arcane-rings/ /opt/homebrew/bin/bunx vite preview --host 127.0.0.1 --port 4177` - passed browser smoke at `http://127.0.0.1:4177/arcane-rings/`.
  - JavaScript, CSS, and public image asset URLs returned 200 with the expected content types.
  - In-app browser mobile viewport loaded the menu and puzzle screen.
  - Runtime CSS asset variables resolved under `/arcane-rings/`.
  - No broken images, no console errors, and no horizontal overflow were observed.

Remote GitHub Actions and GitHub Pages deployment were not run from this local session.
