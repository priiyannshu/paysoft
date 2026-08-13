"""
Idempotent seed script for PaySoft v2.

Generates seed.sql containing:
  - 1 demo organization
  - 19 departments
  - 385 employees with realistic Indian names and salary structures
  - Configurations (PTax, PF/ESI thresholds)
  - Sample declarations and leave records

Usage:
  python3 app/pipeline/scripts/seed.py > seed.sql
  wrangler d1 execute paysoft --file=seed.sql --remote
  wrangler d1 execute paysoft --file=seed.sql --local

Idempotent: wipes all data before inserting. Safe to re-run.
"""

import json
import random
from datetime import datetime, timedelta
from pathlib import Path

random.seed(42)

ROOT = Path(__file__).resolve().parent.parent.parent.parent

# --- Data ---------------------------------------------------------------------

ORG_ID = "org_demo_001"
ORG_CODE = "DEMO"
ORG_NAME = "Makcomputers Rai Pvt Ltd"

DEPARTMENTS = [
    ("Administration", "ADM"),
    ("Human Resources", "HR"),
    ("Finance", "FIN"),
    ("Information Technology", "IT"),
    ("Sales", "SAL"),
    ("Marketing", "MKT"),
    ("Production", "PRD"),
    ("Quality Assurance", "QA"),
    ("Maintenance", "MNT"),
    ("Stores", "STR"),
    ("Dispatch", "DSP"),
    ("Design", "DSN"),
    ("Purchase", "PUR"),
    ("R&D", "RND"),
    ("Security", "SEC"),
    ("Housekeeping", "HSK"),
    ("Transport", "TRN"),
    ("Canteen", "CNT"),
    ("Legal", "LEG"),
]

FIRST_NAMES = [
    "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan",
    "Krishna", "Ishaan", "Ananya", "Diya", "Myra", "Sara", "Aanya", "Aadhya",
    "Isha", "Riya", "Priya", "Neha", "Rahul", "Amit", "Suresh", "Vikram",
    "Deepak", "Pooja", "Kavita", "Sunita", "Rajesh", "Sanjay", "Meera",
    "Nisha", "Preeti", "Vijay", "Ajay", "Ramesh", "Mahesh", "Dinesh",
    "Lakshmi", "Savita", "Geeta", "Anil", "Manoj", "Tarun", "Nitin",
    "Pankaj", "Ashish", "Mohan", "Lalit", "Yogesh", "Ganesh", "Jagdish",
    "Rohit", "Saurabh", "Gaurav", "Mohit", "Naveen", "Pawan", "Ravi",
    "Shyam", "Bharat", "Kiran", "Swati", "Shruti", "Pallavi", "Poonam",
    "Ranjit", "Harish", "Dharmendra", "Brijesh", "Naresh", "Satish",
    "Ankita", "Divya", "Ritika", "Shweta", "Tanvi", "Nidhi", "Komal",
    "Sonali", "Mamta", "Sakshi", "Shraddha", "Jyoti", "Sudha", "Kamla",
    "Rani", "Bimla", "Chandra", "Uma", "Sita", "Radha", "Parvati",
]

LAST_NAMES = [
    "Sharma", "Verma", "Gupta", "Singh", "Kumar", "Patel", "Reddy", "Nair",
    "Menon", "Iyer", "Joshi", "Mishra", "Pandey", "Tiwari", "Dubey",
    "Srivastava", "Agarwal", "Saxena", "Chaturvedi", "Bhat", "Rao", "Desai",
    "Pillai", "Kulkarni", "Ghosh", "Banerjee", "Mukherjee", "Chatterjee",
    "Das", "Bose", "Sen", "Roy", "Malhotra", "Kapoor", "Mehta", "Chopra",
    "Seth", "Thakur", "Chauhan", "Rathore", "Tomar", "Pawar", "More",
    "Kadam", "Shinde", "Patil", "Jadhav", "Bhosale", "Mahajan",
    "Deshmukh", "Gaikwad", "Wagh", "Dixit", "Hegde",
]

# --- Helpers ------------------------------------------------------------------

def uid(prefix, *parts):
    return f"{prefix}_{'_'.join(parts)}".replace(" ", "_").lower()

def iso_date(d):
    return d.strftime("%Y-%m-%d")

def random_date(start_year, end_year):
    start = datetime(start_year, 1, 1)
    end = datetime(end_year, 12, 31)
    delta = (end - start).days
    return iso_date(start + timedelta(days=random.randint(0, delta)))

def sql_str(s):
    return "'" + s.replace("'", "''") + "'"

def sql_val(v):
    if v is None:
        return "NULL"
    if isinstance(v, (int, float)):
        return str(v)
    return sql_str(str(v))

# --- Generators ---------------------------------------------------------------

def generate_organization():
    return "\n".join([
        "-- Organization",
        f"INSERT INTO organizations (id, name, code, address, state_code, created_at) "
        f"VALUES ({sql_val(ORG_ID)}, {sql_str(ORG_NAME)}, {sql_str(ORG_CODE)}, "
        f"{sql_str('123 Industrial Area, Pune, Maharashtra')}, 'MH', unixepoch());",
    ])

def generate_departments():
    lines = ["", "-- Departments"]
    for name, code in DEPARTMENTS:
        dept_id = uid("dept", code.lower())
        lines.append(
            f"INSERT INTO departments (id, org_id, name, code, created_at) "
            f"VALUES ({sql_val(dept_id)}, {sql_val(ORG_ID)}, {sql_str(name)}, {sql_str(code)}, unixepoch());"
        )
    return "\n".join(lines)

def generate_employees():
    lines = ["", "-- Employees"]
    dept_ids = [uid("dept", code.lower()) for _, code in DEPARTMENTS]

    total_employees = 385
    weights = [15, 12, 10, 25, 30, 18, 40, 15, 12, 10, 8, 15, 10, 8, 20, 15, 12, 10, 5]
    weights = [max(1, w) for w in weights]
    total_weight = sum(weights)

    emp_num = 1
    for dept_idx, dept_id in enumerate(dept_ids):
        count = round(total_employees * weights[dept_idx] / total_weight)
        count = max(1, count)
        for _ in range(count):
            if emp_num > total_employees:
                break
            emp_id = uid("emp", f"{emp_num:04d}")
            code = f"EMP{emp_num:04d}"
            first = random.choice(FIRST_NAMES)
            last = random.choice(LAST_NAMES)
            basic = random.choice([15000, 18000, 22000, 25000, 30000, 35000, 40000, 50000, 60000, 75000, 90000, 120000])
            da_pct = random.choice([0, 4, 5, 8, 12])
            hra_pct = random.choice([40, 50])
            allowances = json.dumps({"conveyance": 1600, "medical": 1250, "special": round(basic * 0.10)})
            pan = f"ABCDE{random.randint(1000,9999)}F"
            aadhaar = f"{random.randint(1000,9999)} {random.randint(1000,9999)} {random.randint(1000,9999)}"
            pf_uan = f"100{random.randint(10000000,99999999)}"
            esi = f"31{random.randint(10000000,99999999)}" if basic <= 21000 else None
            dob = random_date(1960, 2002)
            doj = random_date(2010, 2025)
            doa = doj
            gender = random.choice(["M", "F"])
            regime = random.choice(["old", "new"])
            bank = random.choice(["SBI", "HDFC", "ICICI", "Axis", "PNB", "BOB", "Canara"])
            acct = str(random.randint(1000000000, 9999999999))
            ifsc = f"{bank[:4]}0{random.randint(100000,999999)}"
            phone = f"{random.choice([6,7,8,9])}{random.randint(100000000,999999999)}"
            email = f"{first.lower()}.{last.lower()}@example.com"

            cols = "(id, org_id, department_id, code, first_name, last_name, email, phone, date_of_birth, gender, pan_number, aadhaar_number, pf_uan, esi_number, date_of_joining, date_of_appointment, status, basic_pay, da_percent, hra_percent, allowances, bank_name, bank_account, bank_ifsc, tax_regime, created_at, updated_at)"
            vals = (f"{sql_val(emp_id)}, {sql_val(ORG_ID)}, {sql_val(dept_id)}, {sql_str(code)}, {sql_str(first)}, {sql_str(last)}, {sql_str(email)}, {sql_str(phone)}, {sql_str(dob)}, {sql_str(gender)}, {sql_str(pan)}, {sql_str(aadhaar)}, {sql_val(pf_uan)}, {sql_val(esi)}, {sql_str(doj)}, {sql_str(doa)}, 'active', {basic}, {da_pct}, {hra_pct}, {sql_str(allowances)}, {sql_str(bank)}, {sql_str(acct)}, {sql_str(ifsc)}, {sql_str(regime)}, unixepoch(), unixepoch()")
            lines.append(f"INSERT INTO employees {cols} VALUES ({vals});")
            emp_num += 1

    return "\n".join(lines)

def generate_configurations():
    configs = [
        ("ptax_mh", "200", "Maharashtra Professional Tax per month"),
        ("pf_employee_rate", "12", "Employee PF rate percent"),
        ("pf_employer_eps_cap_basic", "15000", "EPS cap on basic pay"),
        ("pf_eps_rate", "8.33", "EPS rate percent"),
        ("pf_epf_rate", "3.67", "EPF rate percent"),
        ("esi_employee_rate", "0.75", "Employee ESI rate percent"),
        ("esi_employer_rate", "3.25", "Employer ESI rate percent"),
        ("esi_gross_threshold", "21000", "ESI eligibility gross threshold"),
        ("pf_gross_threshold", "15000", "PF eligibility gross threshold"),
    ]
    lines = ["", "-- Configurations"]
    for i, (key, val, desc) in enumerate(configs):
        cid = uid("cfg", key)
        lines.append(
            f"INSERT INTO configurations (id, org_id, key, value, description, updated_at) "
            f"VALUES ({sql_val(cid)}, {sql_val(ORG_ID)}, {sql_str(key)}, {sql_str(val)}, {sql_str(desc)}, unixepoch());"
        )
    return "\n".join(lines)

def generate_declarations():
    lines = ["", "-- Sample Declarations (10 random employees)"]
    emp_ids = [uid("emp", f"{i:04d}") for i in range(1, 11)]
    for emp_id in emp_ids:
        decl_id = uid("decl", emp_id[-4:], "80c")
        lines.append(
            f"INSERT INTO declarations (id, org_id, employee_id, fiscal_year, type, amount, status, created_at, updated_at) "
            f"VALUES ({sql_val(decl_id)}, {sql_val(ORG_ID)}, {sql_val(emp_id)}, '2025-26', '80c', 150000, 'pending', unixepoch(), unixepoch());"
        )
    return "\n".join(lines)

def generate_leave_records():
    lines = ["", "-- Sample Leave Records (10 random employees)"]
    emp_ids = [uid("emp", f"{i:04d}") for i in range(1, 11)]
    for emp_id in emp_ids:
        leave_id = uid("leave", emp_id[-4:])
        start = random_date(2025, 2025)
        end = random_date(2025, 2025)
        ltype = random.choice(["casual", "sick", "earned"])
        lines.append(
            f"INSERT INTO leave_records (id, org_id, employee_id, type, start_date, end_date, days, status, created_at, updated_at) "
            f"VALUES ({sql_val(leave_id)}, {sql_val(ORG_ID)}, {sql_val(emp_id)}, {sql_str(ltype)}, {sql_str(start)}, {sql_str(end)}, 1, 'pending', unixepoch(), unixepoch());"
        )
    return "\n".join(lines)

def generate_users():
    lines = ["", "-- Users for Demo Org (password: Password123!)"]
    # PBKDF2 hash for 'Password123!'
    pw_hash = "pbkdf2$100000$11223344556677889900aabbccddeeff$f7439eda3b98229093e2d85d50c16cd4282ed509b0fac123bc482d1222bc12c1"
    user_data = [
        ("usr_admin", "admin@demo.paysoft", "super_admin", "PSR Admin / Super Admin"),
        ("usr_hr", "hr@demo.paysoft", "hr_lead", "Priya Sharma (HR Lead)"),
        ("usr_acct", "accountant@demo.paysoft", "payroll_accountant", "Ramesh Verma (Accountant)"),
        ("usr_emp", "sakshi.nair@example.com", "employee", "Sakshi Nair (Employee)"),
    ]
    for uid_val, email, role, name in user_data:
        lines.append(
            f"INSERT INTO users (id, org_id, email, password_hash, role, name, status, created_at, updated_at) "
            f"VALUES ('{uid_val}', '{ORG_ID}', '{email}', '{pw_hash}', '{role}', '{name}', 'active', unixepoch(), unixepoch());"
        )
    return "\n".join(lines)

def generate_payroll_runs():
    lines = ["", "-- Historical Payroll Runs & Salary Records (FY 2025-26)"]
    months = [
        (4, 2025, "frozen"), (5, 2025, "frozen"), (6, 2025, "frozen"),
        (7, 2025, "frozen"), (8, 2025, "frozen"), (9, 2025, "frozen"),
        (10, 2025, "frozen"), (11, 2025, "frozen"), (12, 2025, "frozen"),
        (1, 2026, "frozen"), (2, 2026, "frozen"), (3, 2026, "computed"),
    ]
    
    # We will generate salary records for the first 100 employees for each month
    emp_ids = [uid("emp", f"{i:04d}") for i in range(1, 108)]
    
    for m, y, status in months:
        run_id = f"PR-{ORG_CODE}-{y}-{m:02d}"
        lines.append(
            f"INSERT INTO payroll_runs (id, org_id, month, year, status, created_at, updated_at) "
            f"VALUES ('{run_id}', '{ORG_ID}', {m}, {y}, '{status}', '{y}-{m:02d}-28T00:00:00Z', '{y}-{m:02d}-28T00:00:00Z');"
        )
        
        # Insert sample salary records
        for i, emp_id in enumerate(emp_ids):
            base_basic = 15000 + ((i * 7) % 65000)
            da = round(base_basic * 0.75) if (i % 2 == 0) else round(base_basic * 0.08)
            hra = round(base_basic * 0.30)
            gross = base_basic + da + hra
            pf_emp = 1800 if gross > 15000 else round(gross * 0.12)
            esi_emp = round(gross * 0.0075) if gross <= 21000 else 0
            ptax = 200
            tds = 2500 if gross > 50000 else 0
            tot_ded = pf_emp + esi_emp + ptax + tds
            net = gross - tot_ded
            ded_json = json.dumps({
                "epf": {"employee": pf_emp, "employer": 550, "eps": 1250},
                "esi": {"employee": esi_emp, "employer": round(gross * 0.0325) if gross <= 21000 else 0},
                "incomeTax": {"monthly": tds, "regime": "new"},
                "professionalTax": ptax
            })
            
            srid = f"sr_{y}_{m:02d}_{emp_id}"
            lines.append(
                f"INSERT INTO salary_records (id, org_id, employee_id, month, year, status, basic_pay, da, hra, gross_earnings, tds, pf_employee, pf_employer, pf_eps, esi_employee, esi_employer, professional_tax, total_deductions, net_pay, run_id, created_at, updated_at) "
                f"VALUES ('{srid}', '{ORG_ID}', '{emp_id}', {m}, {y}, '{status}', {base_basic}, {da}, {hra}, {gross}, {tds}, {pf_emp}, 550, 1250, {esi_emp}, {round(gross * 0.0325) if gross <= 21000 else 0}, {ptax}, {tot_ded}, {net}, '{run_id}', unixepoch(), unixepoch());"
            )
            
    return "\n".join(lines)

# --- Main ---------------------------------------------------------------------

if __name__ == "__main__":
    parts = [
        "PRAGMA foreign_keys = OFF;",
        "DELETE FROM salary_records;",
        "DELETE FROM payroll_runs;",
        "DELETE FROM users;",
        "DELETE FROM sessions;",
        "DELETE FROM declarations;",
        "DELETE FROM leave_records;",
        "DELETE FROM employees;",
        "DELETE FROM departments;",
        "DELETE FROM configurations;",
        "DELETE FROM audit_logs;",
        "DELETE FROM organizations;",
        generate_organization(),
        generate_departments(),
        generate_employees(),
        generate_configurations(),
        generate_declarations(),
        generate_leave_records(),
        generate_users(),
        generate_payroll_runs(),
        "PRAGMA foreign_keys = ON;",
    ]
    out = "\n".join(parts) + "\n"
    out_file = ROOT / "app/data/processed/seed.sql"
    out_file.write_text(out)
    print(f"Generated {out_file} ({len(out)} bytes)")

