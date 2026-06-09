// =============================================================================
// pages/protected/PostsPlaceholder.jsx
// -----------------------------------------------------------------------------
// Placeholder for the Posts/Comments feature (Phase E). Routing structure is in
// place now; the actual list is intentionally NOT implemented yet.
// =============================================================================

export default function PostsPlaceholder() {
  return (
    <div className="placeholder">
      <h2>Posts</h2>
      <p className="muted">
        Posts &amp; comments will be implemented in Phase E. This protected route
        (<code>/users/:username/posts</code>) is wired up and ready.
      </p>
    </div>
  );
}
