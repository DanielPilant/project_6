// =============================================================================
// services/albums.service.js — Data Access Layer (DAL) for albums
// -----------------------------------------------------------------------------
// Dedicated, parameterized DB functions for the albums resource (and the
// nested /albums/:id/photos read). No req/res logic here.
// =============================================================================

const { pool } = require("../config/db");

// SELECT all albums
async function findAll() {
  const [rows] = await pool.query("SELECT * FROM albums ORDER BY id");
  return rows;
}

// SELECT one album by id
async function findById(id) {
  const [rows] = await pool.query("SELECT * FROM albums WHERE id = ?", [id]);
  return rows[0];
}

// SELECT all photos in an album (nested resource)
async function findPhotosByAlbumId(albumId) {
  const [rows] = await pool.query(
    "SELECT * FROM photos WHERE album_id = ? ORDER BY id",
    [albumId]
  );
  return rows;
}

// INSERT a new album; returns the created row
async function create({ user_id, title }) {
  const [result] = await pool.query(
    "INSERT INTO albums (user_id, title) VALUES (?, ?)",
    [user_id, title]
  );
  return findById(result.insertId);
}

// UPDATE an album's title; returns the updated row (or undefined if not found)
async function update(id, { title }) {
  const [result] = await pool.query(
    "UPDATE albums SET title = ? WHERE id = ?",
    [title, id]
  );
  if (result.affectedRows === 0) return undefined;
  return findById(id);
}

// DELETE an album (its photos cascade away); returns true if a row was removed
async function remove(id) {
  const [result] = await pool.query("DELETE FROM albums WHERE id = ?", [id]);
  return result.affectedRows > 0;
}

module.exports = {
  findAll,
  findById,
  findPhotosByAlbumId,
  create,
  update,
  remove,
};
