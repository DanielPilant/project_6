// =============================================================================
// components/AlbumCard.jsx
// -----------------------------------------------------------------------------
// One album: toggle its photos, add images by URL, delete photos / the album.
// =============================================================================

import { useState } from "react";
import Photos from "./Photos";

export default function AlbumCard({ album, user, onDeleted }) {
  const [showPhotos, setShowPhotos] = useState(false);

  return (
    <div className="post-card">
      <h3>{album.title}</h3>
      <div className="row">
        <button onClick={() => setShowPhotos((v) => !v)}>
          {showPhotos ? "Hide photos" : "Show photos"}
        </button>
        <button className="danger" onClick={onDeleted}>
          Delete album
        </button>
      </div>

      {showPhotos && <Photos albumId={album.id} user={user} />}
    </div>
  );
}
