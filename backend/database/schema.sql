-- ============================================================
-- Digital Workforce - KPI-Driven Performance Evaluation Platform
-- PostgreSQL Schema
-- ============================================================

DROP TABLE IF EXISTS attendance_records CASCADE;
DROP TABLE IF EXISTS work_logs CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS evaluation_scores CASCADE;
DROP TABLE IF EXISTS evaluations CASCADE;
DROP TABLE IF EXISTS kpi_assignments CASCADE;
DROP TABLE IF EXISTS kpis CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS departments CASCADE;

-- ------------------------------------------------------------
-- Departments
-- ------------------------------------------------------------
CREATE TABLE departments (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(150) NOT NULL UNIQUE,
    code          VARCHAR(20)  NOT NULL UNIQUE,
    description   TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- Users (Admin / Department Head (HOD) / Employee)
-- ------------------------------------------------------------
CREATE TABLE users (
    id             SERIAL PRIMARY KEY,
    employee_code  VARCHAR(30) UNIQUE,
    name           VARCHAR(150) NOT NULL,
    email          VARCHAR(150) NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,
    role           VARCHAR(20)  NOT NULL DEFAULT 'employee'
                   CHECK (role IN ('admin', 'hod', 'employee')),
    designation    VARCHAR(100),
    department_id  INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    manager_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
    is_active      BOOLEAN NOT NULL DEFAULT TRUE,
    joining_date   DATE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_department ON users(department_id);
CREATE INDEX idx_users_role ON users(role);

-- ------------------------------------------------------------
-- KPI Definitions (measurable, standardized performance metrics)
-- ------------------------------------------------------------
CREATE TABLE kpis (
    id               SERIAL PRIMARY KEY,
    name             VARCHAR(150) NOT NULL,
    description      TEXT,
    department_id    INTEGER REFERENCES departments(id) ON DELETE CASCADE, -- NULL = organization-wide KPI
    unit             VARCHAR(50) NOT NULL DEFAULT 'percentage', -- e.g. percentage, count, days, score
    default_weight   NUMERIC(5,2) NOT NULL DEFAULT 10.00 CHECK (default_weight > 0),
    evaluation_period VARCHAR(20) NOT NULL DEFAULT 'quarterly'
                     CHECK (evaluation_period IN ('monthly', 'quarterly', 'half_yearly', 'annual')),
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_by       INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_kpis_department ON kpis(department_id);

-- ------------------------------------------------------------
-- KPI Assignments (target values assigned to a specific employee for a period)
-- ------------------------------------------------------------
CREATE TABLE kpi_assignments (
    id             SERIAL PRIMARY KEY,
    kpi_id         INTEGER NOT NULL REFERENCES kpis(id) ON DELETE CASCADE,
    employee_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_value   NUMERIC(12,2) NOT NULL CHECK (target_value > 0),
    weight         NUMERIC(5,2) NOT NULL DEFAULT 10.00 CHECK (weight > 0),
    period_start   DATE NOT NULL,
    period_end     DATE NOT NULL,
    assigned_by    INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_period CHECK (period_end >= period_start),
    UNIQUE (kpi_id, employee_id, period_start, period_end)
);

CREATE INDEX idx_kpi_assignments_employee ON kpi_assignments(employee_id);
CREATE INDEX idx_kpi_assignments_kpi ON kpi_assignments(kpi_id);

-- ------------------------------------------------------------
-- Evaluations (one appraisal record per employee per period)
-- ------------------------------------------------------------
CREATE TABLE evaluations (
    id             SERIAL PRIMARY KEY,
    employee_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    evaluator_id   INTEGER REFERENCES users(id) ON DELETE SET NULL,
    department_id  INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    period_start   DATE NOT NULL,
    period_end     DATE NOT NULL,
    status         VARCHAR(20) NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
    overall_score  NUMERIC(6,2), -- auto-computed, 0-150 (allows over-achievement)
    remarks        TEXT,
    submitted_at   TIMESTAMPTZ,
    approved_at    TIMESTAMPTZ,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (employee_id, period_start, period_end)
);

CREATE INDEX idx_evaluations_employee ON evaluations(employee_id);
CREATE INDEX idx_evaluations_department ON evaluations(department_id);
CREATE INDEX idx_evaluations_status ON evaluations(status);

-- ------------------------------------------------------------
-- Evaluation Scores (per-KPI breakdown of an evaluation - automated scoring)
-- ------------------------------------------------------------
CREATE TABLE evaluation_scores (
    id               SERIAL PRIMARY KEY,
    evaluation_id    INTEGER NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
    kpi_id           INTEGER NOT NULL REFERENCES kpis(id) ON DELETE CASCADE,
    target_value     NUMERIC(12,2) NOT NULL,
    achieved_value   NUMERIC(12,2) NOT NULL DEFAULT 0,
    weight           NUMERIC(5,2) NOT NULL,
    achievement_pct  NUMERIC(6,2) NOT NULL DEFAULT 0, -- (achieved/target)*100, capped at 150
    weighted_score   NUMERIC(6,2) NOT NULL DEFAULT 0, -- achievement_pct * weight / 100
    comments         TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (evaluation_id, kpi_id)
);

CREATE INDEX idx_evaluation_scores_evaluation ON evaluation_scores(evaluation_id);

-- ------------------------------------------------------------
-- Audit Logs (transparency & accountability trail)
-- ------------------------------------------------------------
CREATE TABLE audit_logs (
    id           SERIAL PRIMARY KEY,
    user_id      INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action       VARCHAR(100) NOT NULL,
    entity_type  VARCHAR(50) NOT NULL,
    entity_id    INTEGER,
    details      JSONB,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- ------------------------------------------------------------
-- Work Logs (employee daily/task submissions with evidence)
-- ------------------------------------------------------------
CREATE TABLE work_logs (
    id                 SERIAL PRIMARY KEY,
    employee_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kpi_id             INTEGER REFERENCES kpis(id) ON DELETE SET NULL,
    task_title         VARCHAR(200) NOT NULL,
    task_details       TEXT NOT NULL,
    supporting_docs    JSONB NOT NULL DEFAULT '[]', -- array of {fileName, filePath, uploadedAt}
    log_date           DATE NOT NULL DEFAULT CURRENT_DATE,
    status             VARCHAR(20) NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending', 'approved', 'rejected')),
    supervisor_remarks TEXT,
    reviewed_by        INTEGER REFERENCES users(id) ON DELETE SET NULL,
    submitted_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at        TIMESTAMPTZ,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_work_logs_employee ON work_logs(employee_id);
CREATE INDEX idx_work_logs_status ON work_logs(status);
CREATE INDEX idx_work_logs_log_date ON work_logs(log_date);

-- ------------------------------------------------------------
-- Attendance Records (optional integration: biometric/punch-in)
-- ------------------------------------------------------------
CREATE TABLE attendance_records (
    id               SERIAL PRIMARY KEY,
    employee_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    attendance_date  DATE NOT NULL,
    check_in         TIME,
    check_out        TIME,
    total_hours      NUMERIC(5,2),
    status           VARCHAR(20) NOT NULL DEFAULT 'present'
                     CHECK (status IN ('present', 'absent', 'leave', 'half_day', 'holiday')),
    remarks          TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (employee_id, attendance_date)
);

CREATE INDEX idx_attendance_employee_date ON attendance_records(employee_id, attendance_date);
