// =============================================================================
// services/todos.service.js — Data Access Layer (DAL) for todos
// -----------------------------------------------------------------------------
// Dedicated, parameterized DB functions for the todos resource.
// =============================================================================

const { pool } = require("../config/db");

// SELECT all todos
async function findAll() {
  const [rows] = await pool.query("SELECT * FROM todos ORDER BY id");
  return rows;
}

// SELECT one todo by id
async function findById(id) {
  const [rows] = await pool.query("SELECT * FROM todos WHERE id = ?", [id]);
  return rows[0];
}

// INSERT a new todo; `completed` defaults to false when omitted
async function create({ user_id, title, completed }) {
  const [result] = await pool.query(
    "INSERT INTO todos (user_id, title, completed) VALUES (?, ?, ?)",
    [user_id, title, completed ?? false]
  );
  return findById(result.insertId);
}

// UPDATE an existing todo; returns the updated row (or undefined if not found)
async function update(id, { user_id, title, completed }) {
  const [result] = await pool.query(
    "UPDATE todos SET user_id = ?, title = ?, completed = ? WHERE id = ?",
    [user_id, title, completed ?? false, id]
  );
  if (result.affectedRows === 0) return undefined;
  return findById(id);
}

// DELETE a todo; returns true if a row was removed
async function remove(id) {
  const [result] = await pool.query("DELETE FROM todos WHERE id = ?", [id]);
  return result.affectedRows > 0;
}

module.exports = { findAll, findById, create, update, remove };
