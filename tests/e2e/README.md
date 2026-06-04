# Project Circles Playwright Harness

The default Playwright command builds and previews the integrated React app, then
runs the app-shell and browser puzzle checks:

```bash
/opt/homebrew/bin/bun run playwright
```

The standalone fixture remains available for contract-level checks against
`tests/fixtures/project-circles`:

```bash
/opt/homebrew/bin/bun run playwright:fixture
```

The app and fixture should expose the same stable roles and `data-testid` hooks
used by the tests, or the helper selectors in
`tests/e2e/helpers/projectCircles.ts` should be updated as the integration
contract changes.
