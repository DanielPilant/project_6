// =============================================================================
// pages/protected/Account.jsx — user operations (advanced stage)
// -----------------------------------------------------------------------------
// Two self-service forms for the logged-in user:
//   1. Edit profile details  -> PUT /users/:id        (updates localStorage too)
//   2. Change password       -> POST /change-password
//
// (Account blocking after 10 failed logins is enforced on the backend login
// route; nothing extra is needed here.)
// =============================================================================

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/client";
import { getCurrentUser, setCurrentUser } from "../../auth/auth";

export default function Account() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  // --- Profile details form -------------------------------------------------
  const [details, setDetails] = useState({
    name: user.name || "",
    username: user.username || "",
    email: user.email || "",
    phone: user.phone || "",
    website: user.website || "",
  });
  const [detailsMsg, setDetailsMsg] = useState({ error: "", success: "" });

  async function saveDetails(e) {
    e.preventDefault();
    setDetailsMsg({ error: "", success: "" });
    try {
      const { data } = await api.put(`/users/${user.id}`, details);
      const usernameChanged = data.username !== user.username;
      setCurrentUser(data); // keep localStorage in sync
      setDetailsMsg({ error: "", success: "Details updated." });
      // If the username changed, the /users/:username/* URL must follow.
      if (usernameChanged) {
        navigate(`/users/${data.username}/account`, { replace: true });
      }
    } catch (error) {
      setDetailsMsg({
        error: `Failed to update details: ${error.response?.data?.message || error.message}`,
        success: "",
      });
    }
  }

  // --- Change password form -------------------------------------------------
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [pwMsg, setPwMsg] = useState({ error: "", success: "" });

  async function changePassword(e) {
    e.preventDefault();
    setPwMsg({ error: "", success: "" });
    if (pw.newPassword !== pw.confirm) {
      return setPwMsg({ error: "New passwords do not match.", success: "" });
    }
    try {
      await api.post("/change-password", {
        user_id: user.id,
        currentPassword: pw.currentPassword,
        newPassword: pw.newPassword,
      });
      setPwMsg({ error: "", success: "Password changed." });
      setPw({ currentPassword: "", newPassword: "", confirm: "" });
    } catch (error) {
      setPwMsg({
        error: `Failed to change password: ${error.response?.data?.message || error.message}`,
        success: "",
      });
    }
  }

  return (
    <div className="placeholder">
      <h2>Account settings</h2>

      {/* ---- Edit details ---- */}
      <section className="post-card">
        <h3>Edit details</h3>
        <form onSubmit={saveDetails}>
          <label>
            Name
            <input
              value={details.name}
              onChange={(e) => setDetails({ ...details, name: e.target.value })}
            />
          </label>
          <label>
            Username
            <input
              value={details.username}
              onChange={(e) => setDetails({ ...details, username: e.target.value })}
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={details.email}
              onChange={(e) => setDetails({ ...details, email: e.target.value })}
            />
          </label>
          <label>
            Phone
            <input
              value={details.phone}
              onChange={(e) => setDetails({ ...details, phone: e.target.value })}
            />
          </label>
          <label>
            Website
            <input
              value={details.website}
              onChange={(e) => setDetails({ ...details, website: e.target.value })}
            />
          </label>

          {detailsMsg.error && <p className="error">{detailsMsg.error}</p>}
          {detailsMsg.success && <p className="success">{detailsMsg.success}</p>}
          <button type="submit">Save details</button>
        </form>
      </section>

      {/* ---- Change password ---- */}
      <section className="post-card">
        <h3>Change password</h3>
        <form onSubmit={changePassword}>
          <label>
            Current password
            <input
              type="password"
              value={pw.currentPassword}
              onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })}
            />
          </label>
          <label>
            New password
            <input
              type="password"
              value={pw.newPassword}
              onChange={(e) => setPw({ ...pw, newPassword: e.target.value })}
            />
          </label>
          <label>
            Confirm new password
            <input
              type="password"
              value={pw.confirm}
              onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
            />
          </label>

          {pwMsg.error && <p className="error">{pwMsg.error}</p>}
          {pwMsg.success && <p className="success">{pwMsg.success}</p>}
          <button type="submit">Change password</button>
        </form>
      </section>
    </div>
  );
}
