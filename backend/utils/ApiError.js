/**
 * ApiError
 * ─────────────────────────────────────────────────────────────
 * Custom Error subclass that carries an HTTP status code and an
 * optional array of field-level validation errors.
 *
 * Usage:
 *   throw new ApiError(404, 'Job not found');
 *   throw new ApiError(422, 'Validation failed', [{ field: 'email', message: '…' }]);
 *
 * The global errorHandler middleware in middleware/errorHandler.js
 * recognises instances of this class and serialises them correctly.
 */
export class ApiError extends Error {
  /**
   * @param {number}   status  HTTP status code (4xx / 5xx)
   * @param {string}   message Human-readable error message
   * @param {Array}    [errors] Optional array of { field, message } objects
   */
  constructor(status, message, errors = []) {
    super(message);
    this.name   = 'ApiError';
    this.status = status;
    this.errors = errors;
    // Preserve stack trace in V8 environments
    if (Error.captureStackTrace) Error.captureStackTrace(this, ApiError);
  }

  // ── Factory helpers ─────────────────────────────────────────

  static badRequest(msg, errors)  { return new ApiError(400, msg, errors); }
  static unauthorized(msg)        { return new ApiError(401, msg ?? 'Unauthorized'); }
  static forbidden(msg)           { return new ApiError(403, msg ?? 'Forbidden'); }
  static notFound(msg)            { return new ApiError(404, msg ?? 'Not found'); }
  static conflict(msg)            { return new ApiError(409, msg ?? 'Conflict'); }
  static unprocessable(msg, errs) { return new ApiError(422, msg ?? 'Unprocessable entity', errs); }
  static internal(msg)            { return new ApiError(500, msg ?? 'Internal server error'); }
}

export default ApiError;
