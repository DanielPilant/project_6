// =============================================================================
// services/admin.service.js — Data Access Layer for the admin dashboard
// -----------------------------------------------------------------------------
// Admin-only DB reads/writes: a single "everything" snapshot, plus role and
// block management on users.
// =============================================================================

const { pool } = require("../config/db");

// Everything the dashboard needs, in ONE round trip (also helps satisfy the
// "reduce client→server access" requirement).
async function getAllData() {
  const [users] = await pool.query(
    `SELECT u.id, u.name, u.username, u.email, u.phone, u.website,
            u.is_admin, u.is_super_admin,
            a.failed_attempts, a.blocked_at
       FROM users u
       LEFT JOIN user_auth a ON a.user_id = u.id
      ORDER BY u.id`
  );
  const [todos] = await pool.query("SELECT * FROM todos ORDER BY id");
  const [posts] = await pool.query("SELECT * FROM posts ORDER BY id");
  const [comments] = await pool.query("SELECT * FROM comments ORDER BY id");
  const [albums] = await pool.query("SELECT * FROM albums ORDER BY id");
  const [photos] = await pool.query("SELECT * FROM photos ORDER BY id");

  return { users, todos, posts, comments, albums, photos };
}

// Promote/demote a user (0 or 1).
async function setUserRole(userId, isAdmin) {
  const [result] = await pool.query(
    "UPDATE users SET is_admin = ? WHERE id = ?",
    [isAdmin ? 1 : 0, userId]
  );
  return result.affectedRows > 0;
}

// Block (set the failure counter to the max + stamp a lock) or unblock (clear).
async function setUserBlocked(userId, blocked, maxAttempts) {
  const sql = blocked
    ? "UPDATE user_auth SET failed_attempts = ?, blocked_at = NOW() WHERE user_id = ?"
    : "UPDATE user_auth SET failed_attempts = 0, blocked_at = NULL WHERE user_id = ?";
  const params = blocked ? [maxAttempts, userId] : [userId];
  const [result] = await pool.query(sql, params);
  return result.affectedRows > 0;
}

module.exports = { getAllData, setUserRole, setUserBlocked };
