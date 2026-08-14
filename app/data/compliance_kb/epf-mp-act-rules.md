# Employees' Provident Funds & Miscellaneous Provisions Act, 1952 (EPFO)

## 1. Statutory Applicability & Wage Ceiling

- **Establishment Coverage:** Mandatory for every establishment employing 20 or more persons.
- **Statutory Wage Ceiling:** **₹15,000 per month** (Basic + Dearness Allowance + Retaining Allowance).
- **Statutory Cap on PF Calculation:**
  - If gross basic wage > ₹15,000, employer may opt to cap employee PF contribution at ₹1,800/month (12% of ₹15,000) OR compute 12% on actual Basic + DA.
  - PaySoft standard configuration computes 12% of Basic up to the ₹1,800 threshold or statutory actuals.

---

## 2. Contribution Breakdown & Split

Total EPF contribution is split into Employee Share and Employer Share:

| Component | Share | Rate (%) | Wage Base | Maximum Cap / Month |
| :--- | :--- | :--- | :--- | :--- |
| **Employee Share** | Employee | **12.00%** | Basic + DA | ₹1,800 (if capped) |
| **Employer EPF Share** | Employer | **3.67%** | Basic + DA | ₹550 (if wage = ₹15k) |
| **Employer EPS Share** | Employer (Pension) | **8.33%** | Capped at ₹15,000 | **₹1,250** maximum |
| **EDLI Contribution** | Employer (Insurance) | **0.50%** | Capped at ₹15,000 | ₹75 maximum |
| **EPF Admin Charges** | Employer | **0.50%** | Gross EPF Wages | Minimum ₹500/month |

### Summary of Split:
- Employee pays: **12%** (All to EPF Account 1).
- Employer pays: **12%** (3.67% to EPF Account 1 + 8.33% to EPS Account 10).
- Total statutory deposit in EPFO: **24%** + admin charges.

---

## 3. Universal Account Number (UAN) & Statutory Forms

- **UAN (Universal Account Number):** 12-digit permanent number assigned to every PF member.
- **Form 11 (EPF Declaration Form):** Filled by newly joined employee declaring previous PF account and Aadhaar/PAN linking.
- **Form 19:** Final PF settlement application upon leaving service.
- **Form 10C:** Scheme Certificate / EPS Pension withdrawal application.
- **Form 31:** Application for advance / partial withdrawal from EPF (for house purchase, medical illness, marriage, education).

---

## 4. ECR (Electronic Challan-cum-Return) Version 2 Format

EPFO requires employers to file monthly returns in `#~#` delimited format:
- Field 1: UAN (12 chars)
- Field 2: Member Name (30 chars)
- Field 3: Gross Wages
- Field 4: EPF Wages (capped at 15,000)
- Field 5: EPS Wages (capped at 15,000)
- Field 6: EDLI Wages (capped at 15,000)
- Field 7: EE Share (12% of EPF Wages)
- Field 8: EPS Share (8.33% of EPS Wages, max 1250)
- Field 9: ER Share (EE Share minus EPS Share)
- Field 10: NCP (Non-Contributory Period) Days
- Field 11: Refund of Advances
