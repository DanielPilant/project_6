// =============================================================================
// layouts/AppLayout.jsx — protected application shell
// -----------------------------------------------------------------------------
// Rendered only for authenticated users (guarded by <ProtectedRoute>). Mounted
// at /users/:username/* so the URL carries the username dynamically, e.g.
// /users/bret/posts. Provides the two required actions:
//
//   * Info button   — toggles a panel showing the user's personal info.
//                     The password is NEVER stored client-side nor shown here.
//   * Logout button — clears localStorage and redirects to /login.
//
// Nested protected pages (posts/todos placeholders for now) render in <Outlet/>.
// =============================================================================

import { useState } from "react";
import {
  NavLink,
  Outlet,
  useNavigate,
  useParams,
  Navigate,
} from "react-router-dom";
import { getCurrentUser, logout } from "../auth/auth";

export default function AppLayout() {
  const navigate = useNavigate();
  const { username } = useParams();
  const user = getCurrentUser();
  const [showInfo, setShowInfo] = useState(false);

  // Defensive: if the URL username doesn't match the logged-in user, send them
  // to their own space (prevents /users/someoneelse/... by URL editing).
  if (user && user.username !== username) {
    return <Navigate to={`/users/${user.username}/posts`} replace />;
  }

  function handleLogout() {
    logout(); // clears localStorage
    navigate("/login", { replace: true });
  }

  // Build the display object explicitly EXCLUDING any password-like field, so a
  // password can never appear on screen even if the stored object changes.
  const { password, password_hash, ...safeInfo } = user || {};

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <div className="brand">
            <strong>📋 JSONPlaceholder App</strong>
            <span className="muted"> — signed in as {user?.username}</span>
          </div>

          <nav className="app-nav">
            <NavLink to={`/users/${username}/posts`}>Posts</NavLink>
            <NavLink to={`/users/${username}/todos`}>Todos</NavLink>
            <NavLink to={`/users/${username}/albums`}>Albums</NavLink>
            <NavLink to={`/users/${username}/account`}>Account</NavLink>
            {/* Admin link only for admins */}
            {user?.is_admin ? (
              <NavLink to={`/users/${username}/admin`}>Admin</NavLink>
            ) : null}
          </nav>

          <div className="app-actions">
            <button className="ghost" onClick={() => setShowInfo((v) => !v)}>
              {showInfo ? "Hide Info" : "Info"}
            </button>
            <button className="danger" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Personal info panel — password explicitly NOT included */}
      {showInfo && (
        <section className="info-panel">
          <h2>Your information</h2>
          <ul>
            {Object.entries(safeInfo).map(([key, value]) => (
              <li key={key}>
                <span className="info-key">{key}</span>
                <span className="info-value">{String(value)}</span>
              </li>
            ))}
          </ul>
          <p className="hint">
            For security, your password is never stored in the browser or shown here.
          </p>
        </section>
      )}

      <main className="app-main">
        <Outlet />
      </main>

      <footer className="app-footer">
        Full-Stack Project 6 — JSONPlaceholder clone · React + Express + MySQL
      </footer>
    </div>
  );
}
