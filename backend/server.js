require('dotenv').config();
const app = require('./src/app');
const { pool } = require('./src/config/db');

const PORT = Number(process.env.PORT) || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

async function start() {
  try {
    // Verify DB connectivity before serving
    await pool.query('SELECT 1');
    console.log(`✅ Connected to PostgreSQL (${process.env.DB_NAME}@${process.env.DB_HOST}:${process.env.DB_PORT})`);
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }

  const server = app.listen(PORT, () => {
    console.log(`🚀 Digital Workforce API running at http://localhost:${PORT} (${NODE_ENV})`);
  });

  const shutdown = () => {
    console.log('\n🛑 Shutting down server...');
    server.close(() => {
      pool.end();
      process.exit(0);
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start();