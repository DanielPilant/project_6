// =============================================================================
// components/Photos.jsx
// -----------------------------------------------------------------------------
// Photos for one album: grid of images + add-by-URL form + delete.
// =============================================================================

import { useEffect, useState } from "react";
import api from "../api/client";

export default function Photos({ albumId, user }) {
  const [photos, setPhotos] = useState([]);
  const [form, setForm] = useState({ title: "", url: "" });
  const [error, setError] = useState("");

  async function load() {
    try {
      const { data } = await api.get(`/albums/${albumId}/photos`);
      setPhotos(data);
    } catch (error) {
      setError(
        `Failed to load photos: ${error.response?.data?.message || error.message}`,
      );
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [albumId]);

  // --- POST: "upload" an image by URL --------------------------------------
  async function addPhoto(e) {
    e.preventDefault();
    if (!form.url.trim()) return;
    try {
      const { data } = await api.post("/photos", {
        album_id: albumId,
        user_id: user.id, // backend checks you own this album
        title: form.title.trim(),
        url: form.url.trim(),
      });
      setPhotos([...photos, data]);
      setForm({ title: "", url: "" });
    } catch (error) {
      setError(
        `Failed to add photo: ${error.response?.data?.message || error.message}`,
      );
    }
  }

  // --- DELETE: remove a photo ----------------------------------------------
  async function deletePhoto(id) {
    try {
      await api.delete(`/photos/${id}`, { params: { user_id: user.id } });
      setPhotos(photos.filter((p) => p.id !== id));
    } catch (error) {
      setError(
        `Failed to delete photo: ${error.response?.data?.message || error.message}`,
      );
    }
  }

  return (
    <div className="comments">
      {error && <p className="error">{error}</p>}

      <div className="photo-grid">
        {photos.map((photo) => (
          <figure key={photo.id} className="photo">
            <img src={photo.url} alt={photo.title || "photo"} loading="lazy" />
            <figcaption>
              {photo.title}
              <button className="danger" onClick={() => deletePhoto(photo.id)}>
                ✕
              </button>
            </figcaption>
          </figure>
        ))}
      </div>
      {photos.length === 0 && <p className="muted">No photos yet.</p>}

      {/* Add image by URL (POST) */}
      <form onSubmit={addPhoto} className="photo-form">
        <input
          placeholder="Caption (optional)"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <input
          placeholder="Image URL (https://...)"
          value={form.url}
          onChange={(e) => setForm({ ...form, url: e.target.value })}
        />
        <button type="submit">Add image</button>
      </form>
    </div>
  );
}
