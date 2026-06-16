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
import PostCard from "../../components/PostCard";

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
    } catch (error) {
      setError(
        `Failed to load posts: ${error.response?.data?.message || error.message}`,
      );
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
