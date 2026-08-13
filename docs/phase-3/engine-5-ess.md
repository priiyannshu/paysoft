# Engine 5: ESS & Tax Declaration Engine

## Work Directive
**Phase Branch:** `layer/02-backend`  
**Feature Branch:** `feat/engine-5-ess`  

**Instructions:**
1. Switch to the phase branch: `git checkout layer/02-backend`
2. Create and switch to your feature branch: `git checkout -b feat/engine-5-ess`
3. Implement the engine as specified below.
4. Once tests pass, merge `feat/engine-5-ess` back into `layer/02-backend` and delete the feature branch.

---

## Master Plan Context
Form 12BB declaration flow (submit → HR approve/reject → feeds Engine 3), leave apply/approve/balance, regime simulator (calls Engine 3 twice). `POST /ess/declaration`, `GET /ess/declarations`, `POST /ess/leave`, `POST /ess/simulate-regime`.

---

## Blueprint Specification
- **Input:** Employee-submitted declarations (Form 12BB), leave applications.
- **Process:**
  - Form 12BB: Employee submits → HR reviews → Approved/Rejected → Fed into Engine 3 for revised TDS projection.
  - Tax Regime Simulator: Calls Engine 3 twice (once per regime), returns comparison.
  - Leave: Apply → Approve/Reject → Balance tracking in D1.
- **Output:** Declaration status, leave balances, tax comparison.
- **Endpoints:** `POST /ess/declaration`, `GET /ess/declarations`, `POST /ess/leave`, `POST /ess/simulate-regime`.
