# Defect Report: QUEST-PAYOUT-001

## Status and Evidence Source
Synthetic defect reproduced only in the deliberately faulty local baseline. This is not an observed production incident. Evidence comes from the Quest's user-confirmed synthetic payout rules and actual Playwright runs on 2026-09-27.

## Severity and Impact
High priority for payout correctness: a duplicate or retried task can receive excess test credits, violating the one-entry-per-task-per-window rule. Real-world severity, affected users, and frequency are unknown because this is a local synthetic fixture.

## Prerequisites and Reproduction
From the `quest-demo-new` project root, with dependencies installed, run in PowerShell:

```powershell
$env:PAYOUT_IMPLEMENTATION = 'faulty'
npx playwright test --grep 'duplicate task IDs award credits once|retry confirms payout without awarding credits twice'
```

Inputs are in [tests/payout.test.js](tests/payout.test.js): two completed records share `taskId: duplicate-1` in one payout window; the retry case submits `retry-1` twice for that same window.

## Expected Versus Actual
- Duplicate input expected: 10 credits and one ledger entry. Actual faulty baseline: 20 credits and duplicate ledger entries.
- Retry expected: first payout awards 10; retry succeeds with 0 new credits and one total entry. Actual faulty baseline: retry awards another 10.

## Root Cause
The isolated faulty implementation appends a credit-ledger record for every qualifying input without checking whether the task ID already has an entry for that payout window.

## Failing and Corrected Evidence
- Faulty baseline: both focused tests failed, Playwright exit code 1. Actual assertions: expected 10/received 20 for duplicates; expected 0/received 10 for retry.
- Corrected reference: the same two tests passed, exit code 0.
- Corrected full suite: 10 passed, 0 failed, 0 skipped, exit code 0.
- Exact commands and captured excerpts: [tests/results/quest-red-green.md](tests/results/quest-red-green.md).
- Correct implementation: [src/payoutService.js](src/payoutService.js).

## Proposed Fix and Release-Blocking Checks
Use task ID plus payout window as the idempotency key and check the credit ledger before adding a credit entry. Block release of this behavior if either the duplicate-input or retry regression fails, if more than one ledger entry exists for a task/window, or if the corrected full suite fails. Also retain the boundary, timezone, partial-batch, and notification checks as release requirements. External integration and large-list performance remain unverified.