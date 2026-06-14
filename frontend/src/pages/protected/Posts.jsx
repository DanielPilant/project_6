// =============================================================================
// pages/protected/Posts.jsx — Stage E (simplest version)
// -----------------------------------------------------------------------------
// Shows the active user's posts (sorted by id) and, on demand, each post's
// comments. Full CRUD on both, but PUT/DELETE are owner-only — the backend
// enforces this (returns 403), and we also send the acting user's id so it can.
//
//   GET    /users/:id/posts      -> the user's posts
//   POST   /posts                -> add a post
//   PUT    /posts/:id            -> edit own post   (sends user_id)
//   DELETE /posts/:id?user_id=   -> delete own post
//   GET    /posts/:id/comments   -> a post's comments (loaded on "Show comments")
//   POST   /comments             -> add a comment
//   PUT    /comments/:id         -> edit own comment (sends user_id)
//   DELETE /comments/:id?user_id=-> delete own comment
//
// Kept in one file with the shared axios client for easy reading/extending.
// =============================================================================

import { useEffect, useState } from "react";
import api from "../../api/client";
import { getCurrentUser } from "../../auth/auth";

export default function Posts() {
  const user = getCurrentUser();
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState({ title: "", body: "" });
  const [error, setError] = useState("");

  // --- GET: load this user's posts -----------------------------------------
  async function loadPosts() {
    try {
      const { data } = await api.get(`/users/${user.id}/posts`);
      setPosts(data);
    } catch {
      setError("Failed to load posts");
    }
  }

  useEffect(() => {
    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- POST: add a post -----------------------------------------------------
  async function addPost(e) {
    e.preventDefault();
    if (!newPost.title.trim() || !newPost.body.trim()) return;
    try {
      const { data } = await api.post("/posts", {
        user_id: user.id,
        title: newPost.title.trim(),
        body: newPost.body.trim(),
      });
      setPosts([...posts, data]);
      setNewPost({ title: "", body: "" });
    } catch (error) {
      setError(
        `Failed to add post: ${error.response?.data?.message || error.message}`,
      );
    }
  }

  // --- DELETE: remove own post (acting id sent as query param) --------------
  async function deletePost(id) {
    try {
      await api.delete(`/posts/${id}`, { params: { user_id: user.id } });
      setPosts(posts.filter((post) => post.id !== id));
    } catch (error) {
      setError(
        `Failed to delete post: ${error.response?.data?.message || error.message}`,
      );
    }
  }

  // Replace one post in state after an edit.
  function replacePost(updated) {
    setPosts(posts.map((post) => (post.id === updated.id ? updated : post)));
  }

  return (
    <div className="placeholder">
      <h2>Posts</h2>

      {/* Add form (POST) */}
      <form onSubmit={addPost}>
        <input
          placeholder="Post title"
          value={newPost.title}
          onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
        />
        <textarea
          placeholder="Post body"
          rows={2}
          value={newPost.body}
          onChange={(e) => setNewPost({ ...newPost, body: e.target.value })}
        />
        <button type="submit">Add post</button>
      </form>

      {error && <p className="error">{error}</p>}

      <div className="post-list">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            user={user}
            onChanged={replacePost}
            onDeleted={() => deletePost(post.id)}
          />
        ))}
      </div>

      {posts.length === 0 && <p className="muted">No posts yet.</p>}
    </div>
  );
}

// -----------------------------------------------------------------------------
// One post: view/edit its title+body, and toggle its comments on demand.
// -----------------------------------------------------------------------------
function PostCard({ post, user, onChanged, onDeleted }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ title: post.title, body: post.body });
  const [showComments, setShowComments] = useState(false);
  const isOwner = post.user_id === user.id; // we only show own posts, but be explicit

  // --- PUT: save an edited post --------------------------------------------
  async function save() {
    const { data } = await api.put(`/posts/${post.id}`, {
      user_id: user.id, // acting user; backend checks it owns the post
      title: draft.title,
      body: draft.body,
    });
    onChanged(data);
    setEditing(false);
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

      {showComments && <Comments postId={post.id} user={user} />}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Comments for one post: list + add + owner-only edit/delete.
// -----------------------------------------------------------------------------
function Comments({ postId, user }) {
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
