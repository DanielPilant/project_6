// =============================================================================
// middleware/requireAdmin.js
// -----------------------------------------------------------------------------
// Gate for all /admin routes. There is no auth token in this project, so the
// acting admin's id is sent as `admin_id` (query for GET/DELETE, body for
// PUT/POST). We look that user up and require is_admin = 1, else 403.
//
// NOTE: like the rest of the app this is spoofable without real auth; it is the
// server-side enforcement mechanism, not tamper-proof security.
// =============================================================================

const usersService = require("../services/users.service");

async function requireAdmin(req, res, next) {
  try {
    const adminId = Number(req.body.admin_id || req.query.admin_id);
    if (!adminId) {
      return res.status(400).json({ message: "admin_id is required" });
    }

    const actingUser = await usersService.findById(adminId);
    if (!actingUser || !actingUser.is_admin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    req.admin = actingUser; // make the acting admin available downstream
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = requireAdmin;
