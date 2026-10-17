// Centralized error handling and 404 middleware.

class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

function notFound(req, res) {
  return res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl || req.url}` });
}

function errorHandler(err, req, res, next) {
  console.error('💥 Error:', err.message);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message, details: err.details });
  }

  // PostgreSQL unique violation
  if (err.code === '23505') {
    return res.status(409).json({ message: 'Duplicate entry violates a unique constraint.' });
  }
  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({ message: 'Referenced record does not exist.' });
  }
  // PostgreSQL check violation
  if (err.code === '23514') {
    return res.status(400).json({ message: 'Value violates a database constraint.' });
  }
  if (err.code === '22P02') {
    return res.status(400).json({ message: 'Invalid value for the given field.' });
  }

  return res.status(500).json({ message: 'Something went wrong on the server.' });
}

module.exports = { AppError, notFound, errorHandler };