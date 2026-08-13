# Engine 6: Document Generation Engine

## Work Directive
**Phase Branch:** `layer/02-backend`  
**Feature Branch:** `feat/engine-6-docs`  

**Instructions:**
1. Switch to the phase branch: `git checkout layer/02-backend`
2. Create and switch to your feature branch: `git checkout -b feat/engine-6-docs`
3. Implement the engine as specified below.
4. Verify document structures strictly conform to required formats.
5. Once tests pass, merge `feat/engine-6-docs` back into `layer/02-backend` and delete the feature branch.

---

## Master Plan Context
PDF payslips (`@react-pdf/renderer`, DOB-password-protected), Form 16 Part B, EPF ECR fixed-width text, ESI return file, bank advice XLSX. Stored in R2 at the Phase 1 key layout; download URLs returned. Single-document generation is synchronous here; the queue-based bulk path is Phase 5.

---

## Blueprint Specification
- **Input:** Payroll run ID + document type.
- **Process:**
  - **PDF Payslips:** `@react-pdf/renderer` renders HTML-like components to PDF. Password-protected (employee DOB as default password).
  - **Form 16 Part B:** Annual tax certificate rendered as PDF with employee's full-year TDS details.
  - **EPF ECR File:** Custom text generator for the exact format EPFO portal expects (fixed-width fields, specific headers).
  - **ESI Return File:** Monthly contribution report in ESIC format.
  - **Bank Transfer Advice:** CSV/XLSX formatted for bulk salary credit (using `xlsx` library).
  - **Bulk Generation:** Queue-based. 500 payslips generated asynchronously, stored in R2, ZIP download link returned. (Note: queue path built in Phase 5).
- **Output:** File stored in R2, download URL returned.
- **Endpoints:** `POST /docs/payslip`, `POST /docs/form16`, `POST /docs/ecr`, `POST /docs/bank-advice`, `GET /docs/download/:fileId`.
