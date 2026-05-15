import { ApiError } from '../utils/ApiError.js';

export function notFound(req, res, next) {
  next(ApiError.notFound(`${req.method} ${req.originalUrl}`));
}

/**
 * errorHandler — central error middleware.
 * Priority order:
 *   1. ApiError (thrown by services / controllers)
 *   2. Mongoose ValidationError → 422
 *   3. Mongoose duplicate key   → 409
 *   4. Mongoose CastError       → 404
 *   5. JWT errors               → 401
 *   6. Everything else          → 500
 */
export function errorHandler(err, req, res, _next) {
  // ── ApiError ──────────────────────────────────────────────
  if (err instanceof ApiError) {
    return res.status(err.status).json({
      success: false,
      message: err.message,
      ...(err.errors?.length && { errors: err.errors }),
    });
  }

  let status  = err.status || err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors;

  // Mongoose validation → 422
  if (err.name === 'ValidationError') {
    status  = 422;
    message = 'Validation failed';
    errors  = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  }

  // Duplicate key → 409
  if (err.code === 11000) {
    status  = 409;
    const field = Object.keys(err.keyValue ?? {})[0] ?? 'field';
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} is already in use`;
  }

  // Bad ObjectId → 404
  if (err.name === 'CastError') {
    status  = 404;
    message = 'Resource not found';
  }

  // JWT errors → 401
  if (err.name === 'JsonWebTokenError') { status = 401; message = 'Invalid token'; }
  if (err.name === 'TokenExpiredError') { status = 401; message = 'Token expired — please log in again'; }

  if (process.env.NODE_ENV === 'development') {
    console.error(`[${status}] ${message}`, err.stack);
  }

  res.status(status).json({ success: false, message, ...(errors && { errors }) });
}
