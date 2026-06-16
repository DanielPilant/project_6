// =============================================================================
// components/PostCard.jsx
// -----------------------------------------------------------------------------
// One post: view/edit its title+body, and toggle its comments on demand.
// =============================================================================

import { useState } from "react";
import api from "../api/client";
import Comments from "./Comments";

export default function PostCard({ post, user, onChanged, onDeleted }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ title: post.title, body: post.body });
  const [showComments, setShowComments] = useState(false);
  const [error, setError] = useState("");
  const isOwner = post.user_id === user.id; // we only show own posts, but be explicit

  // --- PUT: save an edited post --------------------------------------------
  async function save() {
    try {
      const { data } = await api.put(`/posts/${post.id}`, {
        user_id: user.id, // acting user; backend checks it owns the post
        title: draft.title,
        body: draft.body,
      });
      onChanged(data);
      setEditing(false);
    } catch (error) {
      setError(
        `Failed to edit post: ${error.response?.data?.message || error.message}`,
      );
    }
  }

  return (
    <div className="post-card">
      {editing ? (
        <>
          <input
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
          <textarea
            rows={2}
            value={draft.body}
            onChange={(e) => setDraft({ ...draft, body: e.target.value })}
          />
          <div className="row">
            <button onClick={save}>Save</button>
            <button onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </>
      ) : (
        <>
          <h3>{post.title}</h3>
          <p>{post.body}</p>
          <div className="row">
            <button onClick={() => setShowComments((v) => !v)}>
              {showComments ? "Hide comments" : "Show comments"}
            </button>
            {isOwner && <button onClick={() => setEditing(true)}>Edit</button>}
            {isOwner && (
              <button className="danger" onClick={onDeleted}>
                Delete
              </button>
            )}
          </div>
        </>
      )}

      {error && <p className="error">{error}</p>}

      {showComments && <Comments postId={post.id} user={user} />}
    </div>
  );
}
