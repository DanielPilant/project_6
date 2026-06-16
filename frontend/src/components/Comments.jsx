// =============================================================================
// components/Comments.jsx
// -----------------------------------------------------------------------------
// Comments for one post: list + add + owner-only edit/delete.
// =============================================================================

import { useEffect, useState } from "react";
import api from "../api/client";

export default function Comments({ postId, user }) {
  const [comments, setComments] = useState([]);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");

  // Inline edit state: which comment is being edited and the draft text.
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  async function load() {
    try {
      const { data } = await api.get(`/posts/${postId}/comments`);
      setComments(data);
    } catch (error) {
      setError(
        `Failed to load comments: ${error.response?.data?.message || error.message}`,
      );
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  // --- POST: add a comment (name/email come from the logged-in user) -------
  async function addComment(e) {
    e.preventDefault();
    if (!body.trim()) return;
    try {
      const { data } = await api.post("/comments", {
        post_id: postId,
        user_id: user.id,
        name: user.name || user.username,
        email: user.email,
        body: body.trim(),
      });
      setComments([...comments, data]);
      setBody("");
    } catch (error) {
      setError(
        `Failed to add comment: ${error.response?.data?.message || error.message}`,
      );
    }
  }

  // --- PUT: save an inline-edited comment body -----------------------------
  function startEdit(comment) {
    setEditingId(comment.id);
    setEditText(comment.body);
  }
  async function saveEdit(comment) {
    if (!editText.trim()) return;
    try {
      const { data } = await api.put(`/comments/${comment.id}`, {
        user_id: user.id, // acting user; backend checks ownership
        name: comment.name,
        email: comment.email,
        body: editText.trim(),
      });
      setComments(comments.map((c) => (c.id === comment.id ? data : c)));
      setEditingId(null);
    } catch (error) {
      setError(
        `Failed to edit comment: ${error.response?.data?.message || error.message}`,
      );
    }
  }

  // --- DELETE: remove own comment ------------------------------------------
  async function deleteComment(id) {
    try {
      await api.delete(`/comments/${id}`, { params: { user_id: user.id } });
      setComments(comments.filter((c) => c.id !== id));
    } catch (error) {
      //TODO: remove the error messege in a good timing
      setError(
        `Failed to delete comment: ${error.response?.data?.message || error.message}`,
      );
    }
  }

  return (
    <div className="comments">
      {error && <p className="error">{error}</p>}
      <ul>
        {comments.map((c) => (
          <li key={c.id}>
            {editingId === c.id ? (
              // Inline edit form (replaces the old prompt popup)
              <span className="row">
                <input
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  autoFocus
                />
                <button onClick={() => saveEdit(c)}>Save</button>
                <button onClick={() => setEditingId(null)}>Cancel</button>
              </span>
            ) : (
              <>
                <strong>{c.name}:</strong> {c.body}
                {/* owner-only actions */}
                {c.user_id === user.id && (
                  <>
                    {" "}
                    <button onClick={() => startEdit(c)}>Edit</button>
                    <button
                      className="danger"
                      onClick={() => deleteComment(c.id)}
                    >
                      Delete
                    </button>
                  </>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
      {comments.length === 0 && <p className="muted">No comments yet.</p>}

      <form
        onSubmit={addComment}
        style={{ flexDirection: "row", gap: "0.5rem" }}
      >
        <input
          placeholder="Add a comment..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <button type="submit">Comment</button>
      </form>
    </div>
  );
}
