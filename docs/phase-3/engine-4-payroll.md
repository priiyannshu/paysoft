# Engine 4: Payroll Execution & Disbursal Engine

## Work Directive
**Phase Branch:** `layer/02-backend`  
**Feature Branch:** `feat/engine-4-payroll`  

**Instructions:**
1. Switch to the phase branch: `git checkout layer/02-backend`
2. Create and switch to your feature branch: `git checkout -b feat/engine-4-payroll`
3. Implement the engine as specified below (depends on Engine 3).
4. Verify Durable Object concurrency and lifecycle state machine.
5. Once tests pass, merge `feat/engine-4-payroll` back into `layer/02-backend` and delete the feature branch.

---

## Master Plan Context
`PayrollRunLock` Durable Object (binding + migration in `wrangler.jsonc`; one lock per org+month), LOP/arrears/bonus/advance recovery math, calls Engine 3, writes salary_records, lifecycle state machine Draft → Processing → Computed → **Frozen** (immutability — Layer 13's cornerstone, built here). `POST /payroll/run`, `GET /payroll/status/:runId`, `POST /payroll/freeze/:monthId`.

---

## Blueprint Specification
- **Input:** Month + year + org ID + attendance data.
- **Process:**
  1. Acquire Durable Object lock (prevents concurrent payroll runs for same org/month).
  2. For each employee: calculate LOP (Loss of Pay) = (Basic + DA) / working days × unpaid days.
  3. Add arrears (delta between old and new salary × retroactive months).
  4. Add bonuses, increments, subtract advance recoveries.
  5. Call Engine 3 to compute statutory deductions.
  6. Produce final net pay.
  7. Write salary records to D1.
  8. Freeze the month (immutable).
  9. Release lock.
- **Output:** Payroll run result with per-employee breakdown.
- **Endpoints:** `POST /payroll/run`, `GET /payroll/status/:runId`, `POST /payroll/freeze/:monthId`.
- **Lifecycle state machine:** Draft → Processing → Computed → Frozen.
