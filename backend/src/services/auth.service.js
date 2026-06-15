// =============================================================================
// services/auth.service.js — Data Access Layer for authentication
// -----------------------------------------------------------------------------
// Handles the two auth-specific DB operations:
//   * registerUser   — INSERT into `users` + `user_auth` inside a TRANSACTION
//                       (both rows must succeed together, or neither does).
//   * findAuthByUsername — read the public profile JOINed with its password
//                       hash, used only during login verification.
//
// Password HASHING happens here (bcrypt) so plaintext never leaves this layer
// and never touches the database. The controller only ever sees hashed data.
// =============================================================================

const bcrypt = require("bcryptjs");
const { pool } = require("../config/db");

const SALT_ROUNDS = 10;
// After this many consecutive failed logins, the account is blocked.
const MAX_FAILED_ATTEMPTS = 10;

// Look up a user by username AND return the stored hash + lockout state (login only).
// Returns { id, name, username, email, phone, website, password_hash,
//           failed_attempts, locked_until } or undefined.
async function findAuthByUsername(username) {
  const [rows] = await pool.query(
    `SELECT u.id, u.name, u.username, u.email, u.phone, u.website,
            u.is_admin, u.is_super_admin,
            a.password_hash, a.failed_attempts, a.locked_until
       FROM users u
       JOIN user_auth a ON a.user_id = u.id
      WHERE u.username = ?`,
    [username]
  );
  return rows[0];
}

// Increment the failed-login counter. When it reaches MAX_FAILED_ATTEMPTS the
// account becomes blocked (we stamp locked_until with the block time).
async function registerFailedAttempt(userId) {
  await pool.query(
    `UPDATE user_auth
        SET failed_attempts = failed_attempts + 1,
            locked_until = IF(failed_attempts + 1 >= ?, NOW(), locked_until)
      WHERE user_id = ?`,
    [MAX_FAILED_ATTEMPTS, userId]
  );
}

// Clear the counter + lock on a successful login and record the login time.
async function resetFailedAttempts(userId) {
  await pool.query(
    `UPDATE user_auth
        SET failed_attempts = 0, locked_until = NULL, last_login_at = NOW()
      WHERE user_id = ?`,
    [userId]
  );
}

// Change a user's password after verifying the current one.
// Returns { ok: true } or { ok: false, status, message }.
async function changePassword(userId, currentPassword, newPassword) {
  const [rows] = await pool.query(
    "SELECT password_hash FROM user_auth WHERE user_id = ?",
    [userId]
  );
  const row = rows[0];
  if (!row) return { ok: false, status: 404, message: "User not found" };

  const matches = await bcrypt.compare(currentPassword, row.password_hash);
  if (!matches) {
    return { ok: false, status: 401, message: "Current password is incorrect" };
  }

  const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await pool.query("UPDATE user_auth SET password_hash = ? WHERE user_id = ?", [
    newHash,
    userId,
  ]);
  return { ok: true };
}

// Create a user profile + auth row atomically. Returns the public user data
// (NO password hash). Throws on duplicate username/email (ER_DUP_ENTRY).
async function registerUser({ name, username, email, phone, website, password }) {
  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [userResult] = await connection.query(
      "INSERT INTO users (name, username, email, phone, website) VALUES (?, ?, ?, ?, ?)",
      [name, username, email, phone ?? null, website ?? null]
    );
    const userId = userResult.insertId;

    await connection.query(
      "INSERT INTO user_auth (user_id, password_hash) VALUES (?, ?)",
      [userId, password_hash]
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

// Compare a plaintext attempt against a stored bcrypt hash.
async function verifyPassword(plaintext, hash) {
  return bcrypt.compare(plaintext, hash);
}

module.exports = {
  findAuthByUsername,
  registerUser,
  verifyPassword,
  registerFailedAttempt,
  resetFailedAttempts,
  changePassword,
  MAX_FAILED_ATTEMPTS,
};
