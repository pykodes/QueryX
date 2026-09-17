-- ============================================================
-- QueryX Database Schema: company.db
-- Table: employees
-- ============================================================

DROP TABLE IF EXISTS employees;

CREATE TABLE employees (
    employee_id INTEGER PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    gender TEXT,
    age INTEGER,
    date_of_birth TEXT,
    department TEXT NOT NULL,
    designation TEXT NOT NULL,
    salary REAL NOT NULL,
    bonus REAL DEFAULT 0.0,
    experience INTEGER DEFAULT 0,
    joining_date TEXT,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'India',
    education TEXT,
    university TEXT,
    skills TEXT,
    project_count INTEGER DEFAULT 0,
    performance_score REAL DEFAULT 0.0,
    attendance_percentage REAL DEFAULT 100.0,
    leave_count INTEGER DEFAULT 0,
    working_hours REAL DEFAULT 8.0,
    overtime_hours REAL DEFAULT 0.0,
    manager TEXT,
    employment_type TEXT DEFAULT 'Full-Time',
    work_location TEXT DEFAULT 'On-Site',
    shift TEXT DEFAULT 'Day',
    blood_group TEXT,
    marital_status TEXT,
    emergency_contact TEXT,
    bank_account TEXT,
    tax_id TEXT,
    insurance_id TEXT,
    last_promotion TEXT,
    next_promotion TEXT,
    training_hours INTEGER DEFAULT 0,
    certifications TEXT,
    projects_completed INTEGER DEFAULT 0,
    projects_pending INTEGER DEFAULT 0,
    client_rating REAL DEFAULT 0.0,
    team_size INTEGER DEFAULT 1,
    monthly_target REAL DEFAULT 0.0,
    target_achieved REAL DEFAULT 0.0,
    sales_amount REAL DEFAULT 0.0,
    customer_count INTEGER DEFAULT 0,
    travel_days INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Active',
    remote_percentage REAL DEFAULT 0.0,
    computer_skill_score REAL DEFAULT 0.0,
    communication_score REAL DEFAULT 0.0,
    leadership_score REAL DEFAULT 0.0,
    innovation_score REAL DEFAULT 0.0,
    teamwork_score REAL DEFAULT 0.0,
    problem_solving_score REAL DEFAULT 0.0,
    job_satisfaction REAL DEFAULT 0.0,
    promotion_count INTEGER DEFAULT 0,
    warnings_count INTEGER DEFAULT 0,
    age_group TEXT,
    salary_grade TEXT,
    annual_bonus REAL DEFAULT 0.0,
    total_compensation REAL DEFAULT 0.0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance and frequent natural language lookups
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_designation ON employees(designation);
CREATE INDEX IF NOT EXISTS idx_employees_salary ON employees(salary);
CREATE INDEX IF NOT EXISTS idx_employees_city ON employees(city);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_work_location ON employees(work_location);
