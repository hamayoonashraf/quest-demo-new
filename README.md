Quest Demo – QA Automation
📌 Overview
This repository contains my Quest assessment project: Prevent a Recurring Business‑Flow Failure.
It demonstrates QA automation for a synthetic settlement/payout flow using Node.js + Playwright, with AI‑assisted test design and documentation.

🎯 Objective
Reproduce a high‑impact failure (duplicate/retry payout).

Establish business rules for settlement and notification flows.

Build automated regression checks to prevent recurrence.

Document defect, root cause, and release readiness.

🛠️ Setup
bash
# Clone the repo
git clone https://github.com/hamayoonashraf/quest-demo-new.git
cd quest-demo-new

# Install dependencies
npm install

# Run Playwright tests
npx playwright test
📂 Deliverables
intent.md → Why this problem, alternatives considered, prioritization.

directive.md → Final scope, requirements, completion criteria, results appendix.

defect.md → Duplicate/retry payout bug report with reproduction steps.

release-checklist.md → Release readiness criteria.

tests/ → Playwright test suite (≥8 cases covering happy path, cutoff, timezone, duplicate, retry, partial failure, notification).

🎥 Loom Video
(≤5 minutes, explains chosen problem, regression failing/passing, AI use, and personal ownership)  
👉 [Loom link goes here]

⚠️ Notes
This is a synthetic demo project for Quest evaluation.

No live financial system or confidential data is included.

All test cases use fictional rules and sanitized inputs.

📊 Results
Regression reproduced: Duplicate/retry payout bug confirmed (failure).

Regression fixed: Corrected implementation passes all 10 Playwright test cases.

Defect documented: Root cause identified (idempotency failure), severity rationale provided, fix proposed.

Release readiness: Checklist enforced; all critical flows pass before release.

Impact: Demonstrated prevention of repeat support incidents in settlement/payout flows.

Remaining gaps: Notification delivery edge cases noted; future work suggested in directive.md.

## 🤖 How I Used AI
- **Test design**: AI helped brainstorm edge cases (cut‑off boundaries, timezone conversions, retries, partial failures).  
- **Scaffolding**: AI generated initial Playwright test skeletons and config files, which I reviewed and refined.  
- **Log analysis & reproduction**: AI assisted in structuring reproduction steps and highlighting idempotency risks.  
- **Documentation**: AI drafted outlines for intent.md and directive.md; I edited for clarity, accuracy, and ownership.  
- **Verification**: I personally ran all tests, confirmed failures/passes, and corrected AI‑suggested code where needed.  

## 🧩 Quest QA Automation Agent
As part of this project, I created a custom **Quest QA Automation Agent**.

- **Purpose**: Scaffold Node.js + Playwright projects, generate test cases, execute suites, and produce defect/release documentation.  
- **Role**: Accelerated setup and ensured structured outputs.  
- **Ownership**: I refined, corrected, and verified all outputs before submission.  

👉 Agent definition: [quest-qa-automation.agent.md](https://github.com/hamayoonashraf/AI-qa-agent/blob/main/.github/agents/quest-qa-automation.agent.md)  
👉 Agent readme: [quest.ai.agent.readme.md](https://github.com/hamayoonashraf/AI-qa-agent/blob/main/quest.ai.agent.readme.md)

## 📎 Optional Extras
Full agent chat transcript available in optional deliverables for transparency.
