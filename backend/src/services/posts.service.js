// =============================================================================
// services/posts.service.js — Data Access Layer (DAL) for posts
// -----------------------------------------------------------------------------
// Dedicated, parameterized DB functions for the posts resource (and the nested
// /posts/:id/comments read). No req/res logic lives here.
// =============================================================================

const { pool } = require("../config/db");

// SELECT all posts
async function findAll() {
  const [rows] = await pool.query("SELECT * FROM posts ORDER BY id");
  return rows;
}

// SELECT one post by id
async function findById(id) {
  const [rows] = await pool.query("SELECT * FROM posts WHERE id = ?", [id]);
  return rows[0];
}

// SELECT all comments belonging to a post (nested resource)
async function findCommentsByPostId(postId) {
  const [rows] = await pool.query(
    "SELECT * FROM comments WHERE post_id = ? ORDER BY id",
    [postId]
  );
  return rows;
}

// INSERT a new post; returns the created row
async function create({ user_id, title, body }) {
  const [result] = await pool.query(
    "INSERT INTO posts (user_id, title, body) VALUES (?, ?, ?)",
    [user_id, title, body]
  );
  return findById(result.insertId);
}

// UPDATE an existing post; returns the updated row (or undefined if not found)
async function update(id, { user_id, title, body }) {
  const [result] = await pool.query(
    "UPDATE posts SET user_id = ?, title = ?, body = ? WHERE id = ?",
    [user_id, title, body, id]
  );
  if (result.affectedRows === 0) return undefined;
  return findById(id);
}

// DELETE a post; returns true if a row was removed
async function remove(id) {
  const [result] = await pool.query("DELETE FROM posts WHERE id = ?", [id]);
  return result.affectedRows > 0;
}

module.exports = {
  findAll,
  findById,
  findCommentsByPostId,
  create,
  update,
  remove,
};
