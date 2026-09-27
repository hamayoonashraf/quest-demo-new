# Quest Directive

Status: User-approved report; Quest handoff is **not ready** until a verifiable Loom/video and reviewer access to generated local reports are resolved. This synthetic project is not a production release sign-off.

## Objective
Prevent duplicate 10-credit awards when a completed task is submitted more than once or retried in the same payout window.

## Scope
- Target: new local synthetic project `quest-demo-new`.
- Primary risk: duplicate/retry payout idempotency.
- Secondary requested checks: excluded settlement upper boundary and notification-failure event recording.
- No production system, real-money settlement, external notification provider, account changes, or admin overrides are in scope.

## Explicit Requirements
- Settlement trigger: Tuesday 09:00 UTC (17:00 MYT).
- Eligibility: Monday 00:00 UTC inclusive through the following Monday 00:00 UTC exclusive, equivalent to Monday 08:00 through the following Monday 08:00 MYT.
- Each qualifying task earns 10 test credits. Task shape is `{ taskId, completed, completedAt }`; malformed fields receive per-task errors and do not block valid tasks. `completed: false` is valid but ineligible.
- A task ID may receive at most one credit-ledger entry per payout window. A same-task/same-window retry confirms success without awarding credits again.
- A successful payout is recorded in in-memory system events. Notification failure must not reverse credits or remove that event.

## Solution Approach
`src/payoutService.js` is the corrected local reference service. `src/fixtures/faultyPayoutService.js` is an isolated, deliberately faulty baseline that omits the task/window idempotency check. The tests exercise only these local synthetic implementations.

## Completion Criteria and Validation
- Ten documented Playwright cases exist, meeting the minimum of eight and covering the required scenarios.
- Red/green evidence: faulty focused baseline 2 failed (exit 1); the same corrected focused regression 2 passed (exit 0).
- Corrected full suite: 10 passed, 0 failed, 0 skipped (exit 0) on 2026-09-27.
- Latest report metadata is passed; no result is claimed beyond these local runs.
- Known gaps: large-list performance; external notification-provider integration; restart persistence (explicitly not required); dedicated rejection tests for non-Tuesday/non-09:00 trigger times.
- `playwright-report/` and `test-results/` are generated local outputs ignored by Git. Their paths are verified locally, but reviewer access is not established; do not upload or share them externally without explicit permission.
- The reviewer owns the score and hiring decision. No score or 76/100 outcome is assigned or promised.

## Results/Handoff Appendix

### Runnable Project and Evidence
- Project setup: [package.json](package.json), [Playwright config](playwright.config.js).
- Reference implementation: [src/payoutService.js](src/payoutService.js).
- Deliberately faulty baseline: [src/fixtures/faultyPayoutService.js](src/fixtures/faultyPayoutService.js).
- All ten runnable cases: [tests/payout.test.js](tests/payout.test.js).
- Red/green commands, exit codes, and output excerpts: [tests/results/quest-red-green.md](tests/results/quest-red-green.md).
- Latest full-suite metadata: [test-results/.last-run.json](test-results/.last-run.json).
- HTML report from the latest corrected run: [playwright-report/index.html](playwright-report/index.html).
- Defect details: [defect.md](defect.md).
- Release checks and open gaps: [release-checklist.md](release-checklist.md).
- Problem rationale and business rules: [intent.md](intent.md).

### Case Results
All listed cases passed in the corrected full-suite run:
1. Happy path awards credits for valid completed tasks.
2. Duplicate task IDs award credits once per payout window.
3. Retry confirms payout without awarding credits twice.
4. Malformed tasks receive per-task errors.
5. Notification failure preserves credits and stored payout event.
6. Cutoff includes the lower boundary and excludes the upper boundary.
7. Timezone offsets are normalized to the MYT eligibility window.
8. Valid tasks are credited while malformed tasks are rejected.
9. Settlement excludes a task exactly at the upper MYT cutoff.
10. Notification failure leaves a complete stored payout success event.

### Reproduction and Viewing
Run from the project root. To reproduce the selected failure against the faulty fixture in PowerShell:

```powershell
$env:PAYOUT_IMPLEMENTATION = 'faulty'
npx playwright test --grep 'duplicate task IDs award credits once|retry confirms payout without awarding credits twice'
```

Expected faulty-baseline result is nonzero: the duplicate assertion receives 20 rather than 10, and retry receives 10 rather than 0 additional credits. Remove the environment override to run the corrected focused regression, then run `npx playwright test` for the full suite. Open `playwright-report/index.html` to view the HTML report.

### AI Collaboration and Candidate Decisions
Candidate confirms that AI scaffolded the project, generated test cases, and assisted with red/green verification; the candidate made the final decisions and confirmations. This is the candidate's account and is not independently verifiable from the repository alone.

### Effort, Limitations, and Handoff
Expected effort was reported as approximately 6-8 hours; actual effort is 7 hours, as candidate-reported. The user confirms the recruiter communicated the exact deadline/timezone, expected effort, and compensation terms. The user supplied deadline is `2026-10-02T23:59 MYT`; compensation details are not copied here.

The Loom/video is pending. The supplied URL `https://www.loom.com/share/abc123xyz456` returned HTTP 404 to anonymous HEAD and GET checks on 2026-09-27; its existence, duration, content, and reviewer access are unverified. Supply a working URL or local video artifact. It must be no longer than five minutes and cover problem ranking, result demonstration, key verification/revision, actual AI use and candidate decisions, and limitations. Do not claim reviewer access until verified. The local fixture is synthetic; it is not a production incident. Handoff is not ready until a verifiable Loom is supplied, generated local reports have an approved reviewer-access path, and all links are checked for reviewer access.

The only three required submission items are:
1. Loom/video (pending; supplied URL returned HTTP 404).
2. [intent.md](intent.md).
3. This final [directive.md](directive.md).

Supporting code, tests, defect report, checklist, reports, and evidence are linked above and are not additional required submission items.

### Rubric Evidence Map
- Problem selection/business rules (20): [intent.md](intent.md), with alternatives, qualitative ranking, user-confirmed rules, and evidence limitations.
- Reproduction/regression engineering (30): [tests/payout.test.js](tests/payout.test.js), faulty fixture, corrected service, and [red/green evidence](tests/results/quest-red-green.md).
- Edge cases/release judgment (25): boundary, timezone, invalid/partial failure, and notification cases; [release-checklist.md](release-checklist.md) records gaps.
- AI collaboration/verification (15): candidate-confirmed AI contribution and candidate-owned decisions are documented above; reviewer scoring remains independent.
- Communication/handoff (10): this directive links the project and results; Loom and reviewer-access verification remain pending.
