# Project Circles Playwright Harness

This workstream owns the browser acceptance harness only. Because this branch does
not contain the integrated app shell, `playwright.config.ts` starts the lightweight
fixture in `tests/fixtures/project-circles` by default.

To retarget the same specs at the real app branch, start that app separately and
set `PROJECT_CIRCLES_BASE_URL`:

```bash
PROJECT_CIRCLES_BASE_URL=http://127.0.0.1:3000 /opt/homebrew/bin/bunx playwright test
```

The real app should expose the same stable roles and `data-testid` hooks used by
the tests, or the helper selectors in `tests/e2e/helpers/projectCircles.ts` should
be updated as the integration contract.
