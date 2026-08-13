-- Engine 5: ESS & Tax Declarations
-- Tables for tax declarations (Form 12BB) and leaves.

CREATE TABLE IF NOT EXISTS tax_declarations (
  id              TEXT PRIMARY KEY,
  employee_id     TEXT NOT NULL,
  financial_year  TEXT NOT NULL,
  declarations_json TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL,
  UNIQUE (employee_id, financial_year)
);

CREATE TABLE IF NOT EXISTS leave_applications (
  id              TEXT PRIMARY KEY,
  employee_id     TEXT NOT NULL,
  leave_type      TEXT NOT NULL,
  start_date      TEXT NOT NULL,
  end_date        TEXT NOT NULL,
  days            REAL NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS leave_balances (
  employee_id     TEXT NOT NULL,
  leave_type      TEXT NOT NULL,
  balance         REAL NOT NULL,
  PRIMARY KEY (employee_id, leave_type)
);
