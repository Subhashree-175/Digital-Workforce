# Digital Workforce
### Government KPI Evaluation and Performance Management Platform

Digital Workforce is a web-based platform designed to digitize employee
performance evaluation in government departments using Key Performance
Indicators (KPIs).

The platform helps administrators and department heads manage employees,
assign KPIs, monitor work progress, evaluate performance, and generate
performance reports through a centralized dashboard.

---

## Features

### Authentication and Authorization
- Secure login using email and password.
- JWT-based authentication.
- Role-based access control.
- Different access permissions for administrators, department heads,
  and employees.

### Employee Management
- Manage employee information.
- Organize employees by department.
- View employee performance information.

### KPI Management
- Create and manage Key Performance Indicators.
- Assign KPIs to employees.
- Track targets and performance metrics.
- Monitor KPI progress.

### Work Log Management
- Record employee work activities.
- Track work progress.
- Maintain work history.

### Performance Evaluation
- Evaluate employee performance based on KPIs.
- Monitor evaluation records.
- Support performance assessment.

### Analytics and Reports
- View performance analytics.
- Monitor departmental performance.
- Generate performance reports.

### Department Management
- Manage government departments.
- Organize employees and department heads.
- Monitor departmental KPIs.

---

## User Roles

| Role | Responsibilities |
|------|------------------|
| Administrator | Manage users, departments, and platform data |
| Department Head | Manage departmental employees and performance |
| Employee | View assigned KPIs and manage work activities |

Actual permissions depend on the application's role-based authorization rules.

---

## Technology Stack

### Frontend
- React.js
- Vite
- JavaScript
- Tailwind CSS

### Backend
- Node.js
- Express.js
- REST API
- JWT Authentication

### Database
- PostgreSQL
- Neon PostgreSQL

### Deployment
- Vercel – Frontend
- Render – Backend
- Neon – Database Hosting

---

## Project Structure

Digital workforce/
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   └── pages/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── app.js
│   ├── server.js
│   └── package.json
│
└── README.md

---

## Prerequisites

Install the following before running the project locally:

- Node.js
- npm
- PostgreSQL database or Neon PostgreSQL account
- Git

---

## Installation and Setup

### 1. Clone the Repository

git clone https://github.com/Subhashree-175/Digital-Workforce.git

cd Digital-Workforce

### 2. Configure the Backend

Navigate to the backend directory:

cd backend

Install dependencies:

npm install

Create a `.env` file in the backend directory.

Configure the following environment variables:

PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=digital_workforce
DB_USER=postgres
DB_PASSWORD=your_database_password

JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=8h

CORS_ORIGIN=http://localhost:5173

For Neon PostgreSQL, use the connection details supplied by Neon.
Configure SSL according to your database connection settings.

Never commit your real `.env` file to GitHub.

### 3. Set Up the Database

Run the database migration command from the backend directory:

npm run migrate

To insert the sample data, run:

npm run seed

Only run the seed command when you intend to insert the supplied demo data.

### 4. Start the Backend

From the backend directory:

npm start

The backend should start on:

http://localhost:5000

Health-check endpoint:

http://localhost:5000/api/health

### 5. Configure the Frontend

Open another terminal and navigate to the frontend directory:

cd frontend

Install dependencies:

npm install

Create a `.env` file inside the frontend directory:

VITE_API_URL=http://localhost:5000

Ensure the frontend uses the configured API base URL and the backend routes
include the `/api` prefix.

### 6. Start the Frontend

Run:

npm run dev

Open the local URL displayed by Vite, usually:

http://localhost:5173

---

## Environment Variables

### Backend

| Variable | Description |
|----------|-------------|
| PORT | Backend server port |
| NODE_ENV | Application environment |
| DB_HOST | PostgreSQL host |
| DB_PORT | PostgreSQL port |
| DB_NAME | Database name |
| DB_USER | Database username |
| DB_PASSWORD | Database password |
| JWT_SECRET | Secret used for signing JWTs |
| JWT_EXPIRES_IN | JWT expiration duration |
| CORS_ORIGIN | Allowed frontend origins, comma-separated |

### Frontend

| Variable | Description |
|----------|-------------|
| VITE_API_URL | Base URL of the backend API |

Do not expose database credentials or private signing secrets in frontend
environment variables.

---

## API Endpoints

The backend exposes REST API routes under the `/api` prefix.

| Endpoint | Purpose |
|----------|---------|
| GET /api/health | Check backend availability |
| /api/auth | Authentication |
| /api/departments | Department management |
| /api/users | User management |
| /api/kpis | KPI management |
| /api/work-logs | Work log management |
| /api/evaluations | Performance evaluations |
| /api/analytics | Performance analytics |
| /api/reports | Report management |

Specific HTTP methods and route paths depend on the individual route files.

Protected endpoints require a valid authentication token and appropriate
user permissions.

---

## Deployment

The application uses the following deployment architecture:

### Frontend – Vercel

Deploy the `frontend` directory using Vercel.

Build command:

npm run build

Output directory:

dist

Set the frontend environment variable:

VITE_API_URL=https://your-render-service.onrender.com

Replace the example value with your actual Render service URL.

### Backend – Render

Deploy the `backend` directory as a Node.js web service.

Build command:

npm install

Start command:

npm start

Configure the required database, JWT, and CORS environment variables in
the Render dashboard.

Set `CORS_ORIGIN` to the exact production Vercel origin or origins.

### Database – Neon

Use the PostgreSQL connection details from your Neon project.

Ensure that the backend can connect to the database and that migrations
have been applied before testing the application.

---

## Security Considerations

- Keep `.env` files out of version control.
- Use a strong, unique JWT secret in production.
- Never publish database passwords or authentication secrets.
- Change demo passwords before allowing public access.
- Restrict CORS to trusted frontend origins.
- Use HTTPS for production deployments.
- Apply appropriate authorization checks to protected endpoints.

---

## Future Enhancements

Potential future improvements include:

- Advanced performance analytics.
- Automated KPI evaluation workflows.
- Improved reporting and visualization.
- Notifications for KPI deadlines.
- Audit trails for administrative activities.
- Additional dashboard customization.

These are potential enhancements and may not be implemented in the current version.

---

## Author

Subhashree Priyadarshini

GitHub: https://github.com/Subhashree-175

---

## License

Specify the license under which this project is distributed.