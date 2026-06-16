// =============================================================================
// pages/protected/Albums.jsx — Albums + Photos (advanced stage)
// -----------------------------------------------------------------------------
// Shows the active user's albums. Each album can show its photos on demand and
// have new images "uploaded" by pasting an image URL. Mirrors the Posts page.
//
//   GET    /users/:id/albums       -> the user's albums
//   POST   /albums                 -> create an album
//   DELETE /albums/:id?user_id=    -> delete own album
//   GET    /albums/:id/photos      -> an album's photos (on demand)
//   POST   /photos                 -> add an image by URL (owner of album only)
//   DELETE /photos/:id?user_id=    -> delete a photo
// =============================================================================

import { useEffect, useState } from "react";
import api from "../../api/client";
import { getCurrentUser } from "../../auth/auth";
import AlbumCard from "../../components/AlbumCard";

export default function Albums() {
  const user = getCurrentUser();
  const [albums, setAlbums] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [error, setError] = useState("");

  // --- GET: load this user's albums ----------------------------------------
  async function loadAlbums() {
    try {
      const { data } = await api.get(`/users/${user.id}/albums`);
      setAlbums(data);
    } catch (error) {
      setError(
        `Failed to load albums: ${error.response?.data?.message || error.message}`,
      );
    }
  }

  useEffect(() => {
    loadAlbums();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- POST: create an album -----------------------------------------------
  async function addAlbum(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      const { data } = await api.post("/albums", {
        user_id: user.id,
        title: newTitle.trim(),
      });
      setAlbums([...albums, data]);
      setNewTitle("");
    } catch (error) {
      setError(
        `Failed to create album: ${error.response?.data?.message || error.message}`,
      );
    }
  }

  // --- DELETE: remove own album --------------------------------------------
  async function deleteAlbum(id) {
    try {
      await api.delete(`/albums/${id}`, { params: { user_id: user.id } });
      setAlbums(albums.filter((a) => a.id !== id));
    } catch (error) {
      setError(
        `Failed to delete album: ${error.response?.data?.message || error.message}`,
      );
    }
  }

  return (
    <div className="placeholder">
      <h2>Albums</h2>

      {/* Create album (POST) */}
      <form onSubmit={addAlbum} style={{ flexDirection: "row", gap: "0.5rem" }}>
        <input
          placeholder="New album title..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <button type="submit">Create album</button>
      </form>

      {error && <p className="error">{error}</p>}

      <div className="post-list">
        {albums.map((album) => (
          <AlbumCard
            key={album.id}
            album={album}
            user={user}
            onDeleted={() => deleteAlbum(album.id)}
          />
        ))}
      </div>

      {albums.length === 0 && <p className="muted">No albums yet.</p>}
    </div>
  );
}

