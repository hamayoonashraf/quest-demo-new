# Release Readiness Checklist

## Actual Verification
- [x] Selected duplicate/retry regression fails against isolated faulty baseline: 2 failed, exit 1.
- [x] Same focused regression passes against corrected reference: 2 passed, exit 0.
- [x] Corrected full Playwright suite: 10 passed, 0 failed, 0 skipped, exit 0 (2026-09-27).
- [x] UTC lower-bound inclusion and upper-bound exclusion exercised.
- [x] MYT `+08:00` offsets exercised at the eligibility boundary.
- [x] Duplicate input and same-window retry idempotency exercised.
- [x] Malformed-task per-record errors and valid-task partial success exercised.
- [x] Notification failure retains awarded credits and stored success event.
- [x] Latest HTML report exists: [playwright-report/index.html](playwright-report/index.html).
- [x] Red/green evidence recorded: [tests/results/quest-red-green.md](tests/results/quest-red-green.md).
- [x] Defect analysis documented: [defect.md](defect.md).

## Release-Blocking Checks for This Behavior
- [ ] Block release if duplicate input creates more than one ledger entry per task ID and payout window.
- [ ] Block release if a retry for the same task/window awards additional credits.
- [ ] Block release if any corrected regression or full-suite check fails.
- [ ] Block release if eligible valid tasks are lost due to malformed neighboring records or notification failure.
- [ ] Block release if the excluded upper cutoff is credited or the inclusive lower cutoff is omitted.

## Open Coverage and Handoff Items
- [ ] Large-list performance has not been measured.
- [ ] No external notification-provider integration was tested.
- [ ] Persistence across process restart is not implemented and is outside the agreed demo rules.
- [ ] Non-Tuesday/non-09:00 trigger rejection lacks a dedicated test.
- [ ] Loom/video is pending; supplied URL returned HTTP 404 to anonymous HEAD and GET requests on 2026-09-27. Existence, duration, content, and access are unverified. Maximum length is five minutes.
- [x] Candidate confirms AI scaffolded the project, generated tests, and assisted with red/green verification; final decisions and confirmations were the candidate's.
- [x] User confirms the recruiter communicated the exact deadline/timezone, expected effort, and compensation terms.
- [x] Actual effort reported by candidate: 7 hours.
- [ ] Generated HTML report and test-results metadata are ignored by Git and remain local; arrange and verify reviewer access only with explicit sharing approval.
- [ ] Reviewer access to any eventual Loom or private links must be checked.

## Readiness Decision
The local synthetic regression evidence is green after the fix. This does not establish production release readiness. Quest handoff is **not ready** while the required Loom/video and verified reviewer access to generated reports remain outstanding. Candidate-reported effort and AI contribution are recorded; recruiter communication of terms is user-confirmed. No score or pass decision is assigned.