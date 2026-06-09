// =============================================================================
// pages/Register.jsx
// -----------------------------------------------------------------------------
// Registration form for new users: username, password, and the other profile
// fields the backend expects (name, email, optional phone/website). On success
// the user is redirected to /login to sign in. Errors (e.g. 409 duplicate) are
// shown on screen.
// =============================================================================

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../auth/auth";

const EMPTY = {
  name: "",
  username: "",
  email: "",
  password: "",
  phone: "",
  website: "",
};

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      await register(form);
      setSuccess("Account created! Redirecting to login...");
      // Send them to login to authenticate with their new credentials.
      setTimeout(() => navigate("/login", { replace: true }), 1200);
    } catch (err) {
      const message =
        err.response?.data?.message || "Registration failed. Please try again.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-card">
      <h1>Create an account</h1>

      <form onSubmit={handleSubmit} noValidate>
        <label>
          Full name *
          <input name="name" value={form.name} onChange={handleChange} required />
        </label>

        <label>
          Username *
          <input
            name="username"
            value={form.username}
            onChange={handleChange}
            autoComplete="username"
            required
          />
        </label>

        <label>
          Email *
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
            required
          />
        </label>

        <label>
          Password *
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            autoComplete="new-password"
            required
          />
        </label>

        <label>
          Phone
          <input name="phone" value={form.phone} onChange={handleChange} />
        </label>

        <label>
          Website
          <input name="website" value={form.website} onChange={handleChange} />
        </label>

        {error && <p className="error" role="alert">{error}</p>}
        {success && <p className="success" role="status">{success}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? "Creating..." : "Register"}
        </button>
      </form>

      <p className="muted">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}
