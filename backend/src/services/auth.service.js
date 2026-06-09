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

// Look up a user by username AND return the stored hash (login only).
// Returns { id, name, username, email, phone, website, password_hash } or undefined.
async function findAuthByUsername(username) {
  const [rows] = await pool.query(
    `SELECT u.id, u.name, u.username, u.email, u.phone, u.website,
            a.password_hash
       FROM users u
       JOIN user_auth a ON a.user_id = u.id
      WHERE u.username = ?`,
    [username]
  );
  return rows[0];
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

module.exports = { findAuthByUsername, registerUser, verifyPassword };
