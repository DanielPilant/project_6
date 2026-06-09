// =============================================================================
// services/comments.service.js — Data Access Layer (DAL) for comments
// -----------------------------------------------------------------------------
// Dedicated, parameterized DB functions for the comments resource.
// =============================================================================

const { pool } = require("../config/db");

// SELECT all comments
async function findAll() {
  const [rows] = await pool.query("SELECT * FROM comments ORDER BY id");
  return rows;
}

// SELECT one comment by id
async function findById(id) {
  const [rows] = await pool.query("SELECT * FROM comments WHERE id = ?", [id]);
  return rows[0];
}

// INSERT a new comment; returns the created row
async function create({ post_id, name, email, body }) {
  const [result] = await pool.query(
    "INSERT INTO comments (post_id, name, email, body) VALUES (?, ?, ?, ?)",
    [post_id, name, email, body]
  );
  return findById(result.insertId);
}

// UPDATE an existing comment; returns the updated row (or undefined if not found)
async function update(id, { post_id, name, email, body }) {
  const [result] = await pool.query(
    "UPDATE comments SET post_id = ?, name = ?, email = ?, body = ? WHERE id = ?",
    [post_id, name, email, body, id]
  );
  if (result.affectedRows === 0) return undefined;
  return findById(id);
}

// DELETE a comment; returns true if a row was removed
async function remove(id) {
  const [result] = await pool.query("DELETE FROM comments WHERE id = ?", [id]);
  return result.affectedRows > 0;
}

module.exports = { findAll, findById, create, update, remove };
