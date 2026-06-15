// =============================================================================
// services/photos.service.js — Data Access Layer (DAL) for photos
// -----------------------------------------------------------------------------
// Dedicated, parameterized DB functions for the photos resource. A photo is
// just an image URL belonging to an album.
// =============================================================================

const { pool } = require("../config/db");

// SELECT all photos
async function findAll() {
  const [rows] = await pool.query("SELECT * FROM photos ORDER BY id");
  return rows;
}

// SELECT one photo by id
async function findById(id) {
  const [rows] = await pool.query("SELECT * FROM photos WHERE id = ?", [id]);
  return rows[0];
}

// INSERT a new photo; returns the created row
async function create({ album_id, title, url }) {
  const [result] = await pool.query(
    "INSERT INTO photos (album_id, title, url) VALUES (?, ?, ?)",
    [album_id, title ?? null, url]
  );
  return findById(result.insertId);
}

// UPDATE a photo's title/url; returns the updated row (or undefined if missing)
async function update(id, { title, url }) {
  const [result] = await pool.query(
    "UPDATE photos SET title = ?, url = ? WHERE id = ?",
    [title ?? null, url, id]
  );
  if (result.affectedRows === 0) return undefined;
  return findById(id);
}

// DELETE a photo; returns true if a row was removed
async function remove(id) {
  const [result] = await pool.query("DELETE FROM photos WHERE id = ?", [id]);
  return result.affectedRows > 0;
}

module.exports = { findAll, findById, create, update, remove };
