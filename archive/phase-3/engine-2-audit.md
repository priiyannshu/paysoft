# Engine 2: Smart Audit & Validation Engine

## Work Directive
**Phase Branch:** `layer/02-backend`  
**Feature Branch:** `feat/engine-2-audit`  

**Instructions:**
1. Switch to the phase branch: `git checkout layer/02-backend`
2. Create and switch to your feature branch: `git checkout -b feat/engine-2-audit`
3. Implement the engine as specified below.
4. Once tests pass, merge `feat/engine-2-audit` back into `layer/02-backend` and delete the feature branch.

---

## Master Plan Context
Org scan for missing PAN/Aadhaar/bank/PF/ESI, senior-citizen thresholds, prior-month freeze check, unassigned structures. Severity levels Critical/Warning/Info. `GET /audit/run`, `GET /audit/status/:orgId`.

---

## Blueprint Specification
- **Input:** Organization ID.
- **Process:** Query D1 for all employees, scan for missing PAN, Aadhaar, bank details, PF/ESI numbers. Check senior citizen age thresholds (60/80). Verify prior-month payroll freeze status. Check unassigned salary structures.
- **Output:** JSON audit report with severity levels (Critical / Warning / Info).
- **Endpoints:** `GET /audit/run`, `GET /audit/status/:orgId`.
