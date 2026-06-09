// =============================================================================
// pages/Login.jsx
// -----------------------------------------------------------------------------
// Login form for existing users. On success the user is saved to localStorage
// (inside login()) and redirected to /users/:username/posts. On failure the
// backend's 401 message is shown ON SCREEN and the user STAYS on /login.
// =============================================================================

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../auth/auth";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = await login(form.username, form.password);
      // Redirect to the protected app; URL carries the username dynamically.
      navigate(`/users/${user.username}/posts`, { replace: true });
    } catch (err) {
      // Rejected login -> show message, remain on the login page.
      const message =
        err.response?.data?.message || "Login failed. Please try again.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-card">
      <h1>Log in</h1>

      <form onSubmit={handleSubmit} noValidate>
        <label>
          Username
          <input
            name="username"
            value={form.username}
            onChange={handleChange}
            autoComplete="username"
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            autoComplete="current-password"
            required
          />
        </label>

        {/* Error message shown on screen for unauthorized attempts */}
        {error && <p className="error" role="alert">{error}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? "Logging in..." : "Log in"}
        </button>
      </form>

      <p className="muted">
        No account? <Link to="/register">Register here</Link>
      </p>
      <p className="hint">Try the seed user <code>bret</code> / <code>password123</code></p>
    </div>
  );
}
