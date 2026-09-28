# Quest Red/Green Evidence

## Context
This is synthetic local-fixture evidence for the duplicate/retry idempotency hypothesis. It is not a production incident or proof of a live defect. Runs were performed on 2026-09-27 in `quest-demo-new`.

## Evidence Summary
- Faulty baseline: both focused regression cases failed as expected; Playwright exit code 1.
- Corrected reference: the same focused cases passed; Playwright exit code 0.
- Corrected full suite: 10 passed, 0 failed, 0 skipped; Playwright exit code 0.
- Latest `test-results/.last-run.json` reports `passed` with no failed tests.
- The configured HTML report is at `playwright-report/index.html`.

## Commands and Exit Codes
Faulty baseline:

```powershell
$env:PAYOUT_IMPLEMENTATION = 'faulty'; npx playwright test --grep 'duplicate task IDs award credits once|retry confirms payout without awarding credits twice'
```

Playwright exit code: `1` (expected for the deliberately faulty fixture).

Corrected focused regression:

```powershell
npx playwright test --grep 'duplicate task IDs award credits once|retry confirms payout without awarding credits twice'
```

The `PAYOUT_IMPLEMENTATION` environment variable was removed before this run. Playwright exit code: `0`.

Corrected full suite:

```powershell
npx playwright test
```

Playwright exit code: `0`.

## Captured Output Excerpts
The following are excerpts from the actual Playwright terminal output.

Faulty baseline assertions:

```text
Expected: 10
Received: 20

Expected: 0
Received: 10

2 failed
PLAYWRIGHT_EXIT_CODE=1
```

Corrected focused regression:

```text
2 passed (2.6s)
PLAYWRIGHT_EXIT_CODE=0
```

Corrected full suite:

```text
10 passed (3.6s)
PLAYWRIGHT_EXIT_CODE=0
```

## Coverage Gaps
- Large-list performance was not exercised.
- Persistence across process restarts is not implemented or required by the agreed demo rules.
- Notification behavior uses a local callback; no external notification provider was integrated.
- Trigger-time validation beyond the configured Tuesday 09:00 UTC settlement time was not separately tested.
