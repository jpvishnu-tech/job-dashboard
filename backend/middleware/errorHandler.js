/**
 * notFound — catches requests that matched no route and creates a 404 error
 * for the global errorHandler below to format and send.
 */
export function notFound(req, res, next) {
  const err = Object.assign(new Error(`Not found — ${req.method} ${req.originalUrl}`), { status: 404 });
  next(err);
}

/**
 * errorHandler — central error middleware.
 * Normalises Mongoose validation errors, duplicate-key errors, and JWT errors
 * into consistent JSON so every client gets the same response shape.
 */
export function errorHandler(err, req, res, _next) {
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
