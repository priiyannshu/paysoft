-- Engine 4: Payroll Execution & Disbursal
-- Tables for payroll runs and per-employee salary records.

CREATE TABLE IF NOT EXISTS payroll_runs (
  id         TEXT PRIMARY KEY,
  org_id     TEXT    NOT NULL,
  month      INTEGER NOT NULL,
  year       INTEGER NOT NULL,
  status     TEXT    NOT NULL DEFAULT 'draft'
               CHECK (status IN ('draft', 'processing', 'computed', 'frozen')),
  created_at TEXT    NOT NULL,
  updated_at TEXT    NOT NULL,
  UNIQUE (org_id, year, month)
);

CREATE TABLE IF NOT EXISTS salary_records (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id           TEXT    NOT NULL REFERENCES payroll_runs(id),
  employee_id      TEXT    NOT NULL,
  gross_earnings   REAL    NOT NULL,
  lop              REAL    NOT NULL DEFAULT 0,
  arrears          REAL    NOT NULL DEFAULT 0,
  bonuses          REAL    NOT NULL DEFAULT 0,
  advance_recovery REAL    NOT NULL DEFAULT 0,
  total_earnings   REAL    NOT NULL,
  total_deductions REAL    NOT NULL,
  net_pay          REAL    NOT NULL,
  deductions_json  TEXT    NOT NULL,
  UNIQUE (run_id, employee_id)
);

CREATE INDEX IF NOT EXISTS idx_salary_records_run_id ON salary_records(run_id);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_org_month ON payroll_runs(org_id, year, month);
