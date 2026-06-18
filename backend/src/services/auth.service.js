// =============================================================================
// services/auth.service.js — Data Access Layer for authentication
// -----------------------------------------------------------------------------
// Per the requirement, the LOGIN password check happens IN SQL (in the JOIN's
// WHERE clause via SHA2), not in Node. Passwords are therefore stored as
// MySQL-computable SHA2(…, 256) hashes instead of bcrypt — bcrypt can't be
// evaluated inside a SQL query.
//
// NOTE: SHA-256 is fast and unsalted, so this is WEAKER than bcrypt. It's the
// price of verifying the password inside the database.
// =============================================================================

const { pool } = require("../config/db");

// After this many consecutive failed logins, the account is blocked.
const MAX_FAILED_ATTEMPTS = 10;

// Lightweight lookup used only to drive the lockout logic: who is this user and
// how many failed attempts do they have? (No password compare here.)
async function findAuthByUsername(username) {
  const [rows] = await pool.query(
    `SELECT u.id, a.failed_attempts
       FROM users u
       JOIN user_auth a ON a.user_id = u.id
      WHERE u.username = ?`,
    [username]
  );
  return rows[0];
}

// THE PASSWORD CHECK, DONE IN SQL.
// Returns the public user row ONLY if username + password both match — the
// comparison is the `a.password_hash = SHA2(?, 256)` in the WHERE clause.
// Returns undefined on a wrong username or wrong password.
async function findUserByCredentials(username, password) {
  const [rows] = await pool.query(
    `SELECT u.id, u.name, u.username, u.email, u.phone, u.website,
            u.is_admin, u.is_super_admin
       FROM users u
       JOIN user_auth a ON a.user_id = u.id
      WHERE u.username = ? AND a.password_hash = SHA2(?, 256)`,
    [username, password]
  );
  return rows[0];
}

// Increment the failed-login counter. When it reaches MAX_FAILED_ATTEMPTS the
// account becomes blocked (we stamp blocked_at with the block time).
async function registerFailedAttempt(userId) {
  await pool.query(
    `UPDATE user_auth
        SET failed_attempts = failed_attempts + 1,
            blocked_at = IF(failed_attempts + 1 >= ?, NOW(), blocked_at)
      WHERE user_id = ?`,
    [MAX_FAILED_ATTEMPTS, userId]
  );
}

// Clear the counter + lock on a successful login and record the login time.
async function resetFailedAttempts(userId) {
  await pool.query(
    `UPDATE user_auth
        SET failed_attempts = 0, blocked_at = NULL, last_login_at = NOW()
      WHERE user_id = ?`,
    [userId]
  );
}

// Change a user's password. The current password is verified IN SQL (SHA2), and
// the new one is hashed by SQL too.
// Returns { ok: true } or { ok: false, status, message }.
async function changePassword(userId, currentPassword, newPassword) {
  const [rows] = await pool.query(
    "SELECT 1 FROM user_auth WHERE user_id = ? AND password_hash = SHA2(?, 256)",
    [userId, currentPassword]
  );
  if (rows.length === 0) {
    return { ok: false, status: 401, message: "Current password is incorrect" };
  }

  await pool.query(
    "UPDATE user_auth SET password_hash = SHA2(?, 256) WHERE user_id = ?",
    [newPassword, userId]
  );
  return { ok: true };
}

// Create a user profile + auth row atomically. The password is hashed by SQL
// (SHA2) on insert. Returns the public user data. Throws ER_DUP_ENTRY on a
// duplicate username/email.
async function registerUser({ name, username, email, phone, website, password }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [userResult] = await connection.query(
      "INSERT INTO users (name, username, email, phone, website) VALUES (?, ?, ?, ?, ?)",
      [name, username, email, phone ?? null, website ?? null]
    );
    const userId = userResult.insertId;

    await connection.query(
      "INSERT INTO user_auth (user_id, password_hash) VALUES (?, SHA2(?, 256))",
      [userId, password]
    );

    await connection.commit();

    return {
      id: userId,
      name,
      username,
      email,
      phone: phone ?? null,
      website: website ?? null,
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

module.exports = {
  findAuthByUsername,
  findUserByCredentials,
  registerUser,
  registerFailedAttempt,
  resetFailedAttempts,
  changePassword,
  MAX_FAILED_ATTEMPTS,
};
