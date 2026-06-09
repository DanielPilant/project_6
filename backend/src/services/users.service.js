// =============================================================================
// services/users.service.js — Data Access Layer (DAL) for users
// -----------------------------------------------------------------------------
// "Dedicated functions for database operations." Each function runs a single,
// parameterized SQL query via the shared pool and returns plain data. No
// req/res here — that's the controller's job. Parameterized queries (`?`)
// prevent SQL injection.
// =============================================================================

const { pool } = require("../config/db");

// SELECT all users
async function findAll() {
  const [rows] = await pool.query("SELECT * FROM users ORDER BY id");
  return rows;
}

// SELECT one user by id (returns the row or undefined)
async function findById(id) {
  const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
  return rows[0];
}

// SELECT all todos belonging to a user (nested resource)
async function findTodosByUserId(userId) {
  const [rows] = await pool.query(
    "SELECT * FROM todos WHERE user_id = ? ORDER BY id",
    [userId]
  );
  return rows;
}

// SELECT all posts belonging to a user (nested resource)
async function findPostsByUserId(userId) {
  const [rows] = await pool.query(
    "SELECT * FROM posts WHERE user_id = ? ORDER BY id",
    [userId]
  );
  return rows;
}

// INSERT a new user; returns the newly created row
async function create({ name, username, email, phone, website }) {
  const [result] = await pool.query(
    "INSERT INTO users (name, username, email, phone, website) VALUES (?, ?, ?, ?, ?)",
    [name, username, email, phone ?? null, website ?? null]
  );
  return findById(result.insertId);
}

// UPDATE an existing user; returns the updated row (or undefined if not found)
async function update(id, { name, username, email, phone, website }) {
  const [result] = await pool.query(
    `UPDATE users
        SET name = ?, username = ?, email = ?, phone = ?, website = ?
      WHERE id = ?`,
    [name, username, email, phone ?? null, website ?? null, id]
  );
  if (result.affectedRows === 0) return undefined;
  return findById(id);
}

// DELETE a user; returns true if a row was removed
async function remove(id) {
  const [result] = await pool.query("DELETE FROM users WHERE id = ?", [id]);
  return result.affectedRows > 0;
}

module.exports = {
  findAll,
  findById,
  findTodosByUserId,
  findPostsByUserId,
  create,
  update,
  remove,
};
