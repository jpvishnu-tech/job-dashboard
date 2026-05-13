/**
 * Wraps an async route handler so unhandled rejections are forwarded to
 * Express's next(err) without needing try/catch in every route.
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export default asyncHandler;
