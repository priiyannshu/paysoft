# Engine 3: Statutory Calculation Engine (The Math Brain)

## Work Directive
**Phase Branch:** `layer/02-backend`  
**Feature Branch:** `feat/engine-3-tax`  

**Instructions:**
1. Switch to the phase branch: `git checkout layer/02-backend`
2. Create and switch to your feature branch: `git checkout -b feat/engine-3-tax`
3. Implement the engine as specified below.
4. Ensure 100% unit-test coverage for pure functions.
5. Once tests pass, merge `feat/engine-3-tax` back into `layer/02-backend` and delete the feature branch.

---

## Master Plan Context
First, because payroll depends on it and it is pure. FY 2025-26 Old/New regime slabs, HRA exemption (min of three), 80C/80D/24b, Section 87A rebate, surcharge + 4% cess, EPF 12% / EPS 8.33% capped / 3.67%, ESI 0.75%/3.25% under ₹21,000, state PTax lookup table. `POST /tax/calculate`, `POST /tax/simulate`. **Unit tests written alongside every function** — salary in, numbers out, no mocking.

---

## Blueprint Specification
- **Input:** Salary structure (basic, allowances) + declarations (80C, 80D, 24b, HRA exemption proof) + tax regime choice.
- **Process:** Pure functions (no side effects, no DB calls):
  - **Income Tax:** Apply Old or New Regime slabs (FY 2025-26). Calculate HRA exemption as min(actual HRA, 50%/40% of basic, rent paid - 10% of basic). Deduct 80C (1.5L cap), 80D, 24b. Apply Section 87A rebate. Add surcharge and 4% Health & Education Cess.
  - **EPF:** Employee 12% of basic. Employer split: 8.33% EPS (capped at 15,000 basic = 1,250/month max), 3.67% EPF.
  - **ESI:** Employee 0.75%, Employer 3.25%. Only if gross ≤ 21,000/month.
  - **PTax:** State-specific slab lookup from KV cache.
- **Output:** Complete deduction breakdown object.
- **Endpoints:** `POST /tax/calculate`, `POST /tax/simulate` (regime comparison).
- **Why pure functions:** 100% unit-testable. No mocking. Salary in, numbers out.
