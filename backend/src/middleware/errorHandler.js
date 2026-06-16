// =============================================================================
// middleware/errorHandler.js
// -----------------------------------------------------------------------------
// Centralized error handling so controllers don't each have to format 500s.
//   * notFound      -> catches any unmatched route and returns 404.
//   * errorHandler  -> Express's 4-arg error middleware; logs and returns 500
//                      (or a known MySQL error mapped to 400/409).
// =============================================================================

// 404 for routes that didn't match anything above
function notFound(req, res, next) {
  res
    .status(404)
    .json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// Final error handler (must have 4 args for Express to recognize it)
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error("[error]", err);

  // Map a couple of common MySQL errors to friendlier client codes.
  if (err.code === "ER_DUP_ENTRY") {
    return res
      .status(409)
      .json({ message: "Resource already exists (duplicate value)" });
  }
  if (
    err.code === "ER_NO_REFERENCED_ROW_2" ||
    err.code === "ER_NO_REFERENCED_ROW"
  ) {
    return res
      .status(400)
      .json({ message: "Invalid foreign key: referenced row does not exist" });
  }

  res.status(500).json({ message: "Internal server error" });
}

module.exports = { notFound, errorHandler };
