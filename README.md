# Digital Workforce — KPI Evaluation Platform

A web-based platform for managing government workforce performance through
Key Performance Indicators (KPIs), work logs, evaluations, and analytics.

## Live Demo

- **Frontend:** https://digital-workforce-m8pr.vercel.app
- **Backend API:** https://digital-workforce.onrender.com
- **Health Check:** https://digital-workforce.onrender.com/api/health

## Features

- User authentication and role-based access control
- Department and user management
- KPI creation, assignment, and tracking
- Employee work-log management
- Performance evaluations
- Analytics and dashboard visualizations
- Report generation
- REST API integration
- PostgreSQL database

## Technology Stack

### Frontend
- React.js
- Vite
- JavaScript
- CSS / Tailwind CSS

### Backend
- Node.js
- Express.js
- REST API
- JWT authentication

### Database
- PostgreSQL
- Neon PostgreSQL hosting

### Deployment
- Vercel — Frontend
- Render — Backend
- Neon — Database

## Project Structure


Digital-Workforce/
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   └── ...
│   ├── package.json
│   └── ...
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── ...
│   ├── server.js
│   └── package.json
└── README.md