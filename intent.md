# Quest Intent

Status: Stage: Test Cases Creation. The selected failure and rules below are synthetic and user-confirmed for this local demo; they do not describe a live MUST product or observed production incident.

## Quest Logistics
- Target: `quest-demo-new` (new local demo).
- Proposed flow: payout.
- Acceptance: user reports the Quest was accepted.
- Deadline: 2026-10-02T23:59 MYT (user-reported); the user confirms the recruiter communicated the exact deadline and timezone.
- Expected effort: approximately 6-8 hours (user-reported); the user confirms the recruiter communicated the expected effort.
- Compensation: user reports it was confirmed in the recruiter email; compensation details are intentionally not copied here.
- Data classification: synthetic/local demo; no production system or real-money transaction.

## Problem Selection and Prioritization
Selected problem: a completed task can be credited more than once when duplicate input is processed or a payout is retried for the same task and payout window.

Evidence source: the Quest brief describes duplicate/retry payout as a risk, and the user selected duplicate/retry idempotency as the primary focus. No incident history, affected-user count, or measured frequency was supplied.

| Rank | Candidate failure (hypothesis) | Potential impact | Likelihood/frequency and confidence | Investigation/fix effort |
|---|---|---|---|---|
| 1 | Duplicate input or retry awards the same task twice in one payout window | High: a task may receive excess test credits and ledger state may be inaccurate | Unknown; confidence low because no incident/frequency evidence was supplied | Medium relative estimate; not measured actual effort |
| 2 | UTC/MYT conversion or cutoff handling misclassifies task eligibility | High: eligible tasks may be omitted or ineligible tasks credited | Unknown; confidence low because no incident/frequency evidence was supplied | Medium relative estimate; not measured actual effort |
| 3 | Partial batch or notification failure loses or obscures a valid payout | Medium-high: successful credits or their record may be missing or unclear | Unknown; confidence low because no incident/frequency evidence was supplied | Medium relative estimate; not measured actual effort |

Why the selected problem: duplicate/retry idempotency is explicitly chosen by the user, has potentially high impact, and is testable in a small local fixture. Likelihood is unknown and was not used as a fabricated score. Affected users/parties are unknown. Intended value is one auditable credit entry per qualifying task per payout window.

Non-goals: production integration, real-money settlement, external notifications, account administration, and admin overrides.

## Business Rules
- Synthetic payout settlement triggers Tuesday at 09:00 UTC (Tuesday 17:00 MYT).
- The eligible completion window is Monday 00:00 UTC inclusive through the following Monday 00:00 UTC exclusive. In MYT the corresponding window is Monday 08:00 through the following Monday 08:00.
- Each qualifying task earns 10 test credits.
- Task shape is `{ taskId, completed, completedAt }`. `taskId` must be a non-empty string, `completed` a boolean, and `completedAt` a valid ISO-8601 timestamp. Missing or malformed fields produce a per-task error. A well-formed task with `completed: false` is valid but ineligible.
- A malformed task does not reject the whole batch. Valid eligible tasks are credited while malformed records are rejected with per-task errors.
- Idempotency key is task ID plus payout window. A retry for the same task ID and window succeeds idempotently but must not add credits. There must be one credit-ledger entry per task ID per payout window.
- Notification is attempted only after a successful payout. Notification failure does not reverse credits. A successful payout event is stored in in-memory system records; restart persistence is not required.
- No account changes or admin rules are in scope.

## Evidence, Uncertainty, and Alternatives
The target was a new, empty local project before Stage: Start; there was no pre-existing payout implementation, test suite, or incident evidence to inspect. The failure candidates are hypotheses based on the supplied Quest risk examples and the user's requested test scenarios, not observed defects. Likelihood/frequency, affected users, and real-world effort remain unknown. Relative effort labels above are estimates.

## Scope and Non-Goals
Primary scope: duplicate/retry idempotency, with the eight required cases covering the happy path, duplicate input, retry, invalid data, notification failure, cutoff boundary, timezone conversion, and partial batch failure. Two additional user-requested cases separately emphasize settlement upper-bound exclusion and the stored notification-failure success event; these are secondary coverage and do not change the primary risk. Use only a synthetic local implementation and data. No production or live financial system is in scope.

## Pre-existing Work and Quest Changes
- Pre-existing: project directory did not exist before this Stage: Start scaffold.
- Quest changes in Stage: Start: project setup files and this initial scaffold only.
- Quest changes in Stage: Test Cases Creation: this problem selection/rule record, the local reference implementation and isolated faulty fixture, and ten test cases (eight required core cases plus two explicitly requested secondary-flow cases). These changes are retrospective to the original scaffold.

## Effort
Expected effort: approximately 6-8 hours as user-reported; this is not actual effort.
Actual effort: 7 hours (candidate-reported on 2026-09-27).

## Execution Evidence
- Date: 2026-09-27.
- Faulty duplicate/retry fixture: two focused tests failed as expected (exit 1). Duplicate input produced 20 instead of 10 credits; retry produced 10 instead of 0 additional credits.
- Corrected reference focused regression: 2 passed (exit 0).
- Corrected full suite: 10 passed, 0 failed, 0 skipped (exit 0).
- Evidence artifact: `tests/results/quest-red-green.md`; HTML report: `playwright-report/index.html`.

## AI Collaboration and Candidate Verification
Candidate confirms that AI scaffolded the project, generated test cases, and assisted with red/green verification; the candidate made the final decisions and confirmations. This is the candidate's statement, not independently verifiable from the repository alone.

## Submission Status
The user supplied and verified the Loom URL `https://www.loom.com/share/4770929596d94a74b23605abc527b121`. The content is confirmed to meet the required five-minute scope and covers the required topics. The user confirms recruiter communication of the deadline/timezone, expected effort, and compensation terms. The final handoff remains conditional on reviewer access to both the Loom video and the generated local reports being confirmed.
