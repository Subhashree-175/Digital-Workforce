# Product Requirements Document (PRD)
## Digital Workforce — KPI-Driven Performance Evaluation Platform

**Version:** 1.0 · **Status:** Implemented / Deployment-ready build

---

## 1. Overview

### 1.1 Problem statement
Government departments rely on manual performance evaluation, subjective
appraisals, delayed reporting and non-measurable performance standards,
causing lack of transparency, performance bias, low accountability and
inefficient workforce utilization.

### 1.2 Solution
A standardized, digital, KPI-driven evaluation platform that automates
performance scoring, improves appraisal transparency and enables
department-level productivity monitoring.

### 1.3 Primary objectives
1. KPI-based evaluation for government employees
2. Automated performance scoring
3. Transparency in appraisals
4. Department-level productivity monitoring

### 1.4 Secondary objectives
- Analytics dashboards
- Reduced paperwork
- Improved reporting efficiency

---

## 2. Personas & roles

| Role       | Responsibilities                                        |
| ---------- | ------------------------------------------------------- |
| Employee   | Authored-in dashboard, work log submission w/ evidence |
| Supervisor | Team monitoring, submission approval, evaluation entry  |
| Admin      | Configuration, KPI definition, cross-department reports |

---

## 3. User flows (high-level)

**A. Employee**
1. Login with government credentials
2. Dashboard: assigned KPIs + performance summary
3. Submit work log (task details + supporting documents)
4. Track status: Pending / Approved / Rejected (with remarks)
5. View monthly / quarterly performance analytics
6. Logout

**B. Supervisor / Manager**
1. Login
2. Team dashboard: KPI status, pending approvals
3. Review employee submissions: verify evidence, approve/reject + comments
4. Monitor team KPI achievement % and performance trends
5. Generate reports (PDF / Excel / CSV)

**C. Admin**
1. Login
2. Configure departments; create & assign KPIs (weightage, evaluation cycle)
3. Monitor cross-department analytics
4. Export reports (PDF/Excel)
5. Manage users & roles; audit trail

---

## 4. Data model summary

| Entity             | Key fields                                                  |
| ------------------ | ----------------------------------------------------------- |
| departments        | name, code, description                                     |
| users              | employee_code, name, email, role, designation, department,  |
|                    | manager (reporting), is_active, joining_date                |
| kpis               | name, unit, default_weight, evaluation_period, department   |
| kpi_assignments    | kpi, employee, target_value, weight, period                 |
| evaluations        | employee, evaluator, period, status, overall_score, remarks |
| evaluation_scores  | kpi, target, achieved, weight, achievement_pct, weighted_score |
| work_logs          | employee, kpi, task details, supporting_docs (JSONB), status, remarks |
| attendance_records | employee, date, check-in/out, total_hours, status           |
| audit_logs         | user, action, entity, details (JSONB), timestamp            |

---

## 5. Automated scoring spec

```
achievement %   = min( (achieved_value / target_value) × 100, 150 )
weighted_score  = achievement % × weight / 100
overall_score   = Σ weighted_score (per evaluation period)
rating bands    = Outstanding ≥120 · Exceeds 100-119 · Meets 80-99
                  Needs Improvement 60-79 · Unsatisfactory <60
```

- Over-achievement rewarded but capped at 150% to avoid outlier distortion.
- Scores are computed server-side; stored explicitly; recomputed on change.

---

## 6. Key performance indicators (platform-level)

- Reduction in manual appraisal time (digital work-log cycle < 1 day review SLA)
- KPI compliance rate (share of employees with active assignments)
- Departmental productivity (avg weighted score / achievement % trend)
- Adoption rate (accounts active, work logs submitted per dept)

---

## 7. Assumptions & constraints

**Assumptions**
- Departments define measurable KPIs; employees submit accurate work logs;
  supervisors validate in SLA; secure hosting exists; training provided.

**Constraints**
- Compliance with government IT policies, high security & encryption,
  limited legacy integration (Phase 1), manual data migration,
  approval-delay resistance, phased implementation, IT budget.

---

## 8. Security & compliance measures implemented

- JWT bearer auth with 8h expiry; bcrypt password hashing
- Role-based access control on every route (admin / hod / employee)
- HOD scope limited to own department / direct reports
- Helmet security headers, CORS allow-list, request size limits
- File upload allow-list + 5 MB cap; audit trail for login/submit/approve
- Prepared statement queries (SQL-injection safe)

## 9. Future enhancements
AI-based analytics · HRMS integration · biometric attendance · mobile app ·
dashboard export scheduling.

## 10. Deliverables in this repository
- Functional web application (backend + frontend)
- Admin, HOD and employee dashboards
- PRD (this file) + README technical documentation
- Database schema, migration, seed; Jest tests; deployment-ready `built frontend`