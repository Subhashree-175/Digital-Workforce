const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const { authenticate, authorize } = require('./middleware/auth');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const departmentRoutes = require('./routes/departments');
const userRoutes = require('./routes/users');
const kpiRoutes = require('./routes/kpis');
const workLogRoutes = require('./routes/workLogs');
const evaluationRoutes = require('./routes/evaluations');
const analyticsRoutes = require('./routes/analytics');
const reportRoutes = require('./routes/reports');

const app = express();

// app.use(helmet());
// app.use(cors({ origin: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(','), credentials: true }));
app.use(helmet());

// const allowedOrigins = [
//   'http://localhost:5173',
//   'https://digital-workforce-frontend.vercel.app',
//   'https://digital-workforce-frontend-git-main-subhashree2.vercel.app',
//   'https://digital-workforce-frontend-6k7sk8ubp-subhashree2.vercel.app',
// ];

// if (process.env.CORS_ORIGIN) {
//   allowedOrigins.push(
//     ...process.env.CORS_ORIGIN
//       .split(',')
//       .map((origin) => origin.trim())
//       .filter(Boolean)
//   );
// }

// app.use(cors({
//   origin: (origin, callback) => {
//     if (!origin || allowedOrigins.includes(origin)) {
//       return callback(null, true);
//     }

//     return callback(new Error(`Origin not allowed by CORS: ${origin}`));
//   },
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
// }));
const allowedOrigins = [
  'http://localhost:5173',
  'https://digital-workforce-m8pr.vercel.app',
  'https://digital-workforce-frontend.vercel.app',
  'https://digital-workforce-frontend-git-main-subhashree2.vercel.app',
  'https://digital-workforce-frontend-6k7sk8ubp-subhashree2.vercel.app',
];

if (process.env.CORS_ORIGIN) {
  allowedOrigins.push(
    ...process.env.CORS_ORIGIN
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean)
  );
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error(`Origin not allowed by CORS: ${origin}`)
      );
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Static uploads (supporting documents)
app.use('/uploads', express.static('uploads'));

// Public routes
app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'digital-workforce-api', time: new Date().toISOString() }));
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/departments', authenticate, authorize('admin', 'hod', 'employee'), departmentRoutes);
app.use('/api/users', authenticate, authorize('admin', 'hod'), userRoutes);
app.use('/api/kpis', authenticate, authorize('admin', 'hod', 'employee'), kpiRoutes);
app.use('/api/work-logs', authenticate, authorize('admin', 'hod', 'employee'), workLogRoutes);
app.use('/api/evaluations', authenticate, authorize('admin', 'hod', 'employee'), evaluationRoutes);
app.use('/api/analytics', authenticate, authorize('admin', 'hod', 'employee'), analyticsRoutes);
app.use('/api/reports', authenticate, authorize('admin', 'hod', 'employee'), reportRoutes);

app.use('/api', notFound);
app.use(errorHandler);

module.exports = app;