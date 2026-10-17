# Digital Workforce — KPI-Driven Government Performance Evaluation Platform

A full-stack web application for replacing manual government performance
appraisals with a standardized, transparent, **KPI-driven digital evaluation
system**. Built with **React (Vite) + Express + PostgreSQL**.

## Problem being solved

Manual appraisals cause lack of transparency, performance bias, low
accountability and inefficient workforce utilization. This platform:

- Implements **KPI-based evaluation** with **automated scoring** (weighted
  achievement % with over-achievement cap at 150%)
- Provides **transparent appraisal workflows** + full **audit trail**
- Enables **department-level productivity monitoring** & analytics dashboards
- Reduces paperwork through **work log submissions with document upload** and
  PDF / Excel / CSV **report exports**

## Tech stack

| Layer      | Technology                                  |
| ---------- | ------------------------------------------- |
| Frontend   | React 18, Vite 5, React Router 6, Recharts  |
| Backend    | Node.js 18+, Express 4, JWT auth, Multer    |
| Database   | PostgreSQL 14+ (verified on 18)             |
| Reports    | ExcelJS (xlsx), pdf-lib (pdf), CSV          |
| Testing    | Jest (scoring unit tests)                   |

## Project structure

```
Digital workforce/
├─ backend/
│  ├─ database/        # schema.sql, migrate.js, seed.js
│  ├─ src/
│  │  ├─ config/       # PostgreSQL pool (dotenv)
│  │  ├─ controllers/  # auth, users, departments, kpis, workLogs,
│  │  │                # evaluations, analytics, reports
│  │  ├─ middleware/   # JWT auth, role authorization, error handler, upload
│  │  ├─ routes/       # REST route definitions
│  │  └─ utils/        # scoring, jwt, audit, report data builders
│  ├─ tests/           # scoring unit tests
│  └─ server.js / src/app.js
└─ frontend/
   └─ src/
      ├─ api/          # fetch client + token handling
      ├─ context/      # AuthContext (role/state)
      ├─ components/   # layout, UI primitives
      └─ pages/        # login, dashboards, work logs, review, evaluations,
                       # assignments, departments, users, audit, reports, profile
```

---

## 1. Prerequisites

- **Node.js 18+** (tested on 22)
- **PostgreSQL 14+** running locally
- A PostgreSQL superuser (e.g. `postgres`) with password

## 2. Database setup

1. Create the database (one time):

   ```bash
   psql -U postgres -h 127.0.0.1 -c "CREATE DATABASE digital_workforce;"
   ```

2. Configure credentials in `backend/.env` (copy from `.env.example`):

   ```env
   DB_HOST=127.0.0.1
   DB_PORT=5432
   DB_NAME=digital_workforce
   DB_USER=postgres
   DB_PASSWORD=your_password_here
   JWT_SECRET=some_long_random_secret
   ```
## 3. Install & run the backend

```bash
cd backend
npm install
npm run setup      # runs migrate + seed (demo data)
npm run dev        # Express on http://localhost:5000
```

- `npm run migrate` — applies `database/schema.sql`
- `npm run seed` — inserts demo departments, users, KPIs, assignments, an
  approved evaluation, work logs and attendance
- `npm test` — runs the automated scoring unit tests

## 4. Install & run the frontend

```bash
cd frontend
npm install
npm run dev        # Vite on http://localhost:5173 (proxies /api to :5000)
```

Open **http://localhost:5173**.

## 5. Demo accounts (password for all: `Password@123`)

| Role       | Email                                    | Scope                                   |
| ---------- | ---------------------------------------- | --------------------------------------- |
| Admin      | admin@digitalworkforce.gov               | Cross-department, users, audit, reports |
| HOD        | anita.sharma@digitalworkforce.gov        | Revenue dept team, evaluations, reports |
| HOD        | rajesh.kumar@digitalworkforce.gov        | Public Works team                       |
| Employee   | priya.verma@digitalworkforce.gov         | Revenue dept (Tehsildar)                |
| Employee   | kavita.rao@digitalworkforce.gov          | IT dept (Data Entry Operator)           |

## 6. Feature map

| User flow          | Capabilities                                                            |
| ------------------ | ------------------------------------------------------------------------ |
| Employee           | Login, dashboard (assigned KPIs + performance), submit work log with     |
|                    | document upload, track Pending/Approved/Rejected, view scores/analytics  |
| Supervisor (HOD)   | Team dashboard, review submissions (approve/reject + comments), create   |
|                    | evaluations with automated scoring, generate reports                     |
| Admin              | Configure departments, create & assign KPIs (weightage + cycle), use     |
|                    | cross-dept analytics, manage users & roles, audit trail, export reports  |

### Key API endpoints
- `POST /api/auth/login` · `GET /api/auth/me`
- `GET/POST/PUT/DELETE /api/departments`, `/api/users`, `/api/kpis`
- `POST /api/kpis/assignments` — assign KPI targets
- `GET/POST /api/work-logs` · `PUT /api/work-logs/:id/review`
- `POST /api/evaluations/upsert` (automated scoring) · `PUT .../submit|approve|reject`
- `GET /api/analytics/summary|department-productivity|kpi-trend|performers|audit-logs`
- `GET /api/reports/:type?format=csv|excel|pdf`

## 7. Automated scoring model
```
achievement % = min( (achieved / target) × 100, 150 )
weighted score = achievement % × weight ÷ 100
overall score = Σ weighted scores for the period
rating bands: Outstanding (≥120) · Exceeds (≥100) · Meets (≥80)
              Needs Improvement (≥60) · Unsatisfactory (<60)
```

## 8. Testing
```bash
cd backend && npm test        # scoring logic + rating bands (11 tests)
```

> ⚠️ `backend/.env` contains local dev credentials. Never commit real
> credentials; use environment variables in production and follow
> government IT/security policies (encryption at rest, TLS, RBAC via
> JWT + role guards).