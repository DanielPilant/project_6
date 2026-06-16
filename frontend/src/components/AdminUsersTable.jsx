// =============================================================================
// components/AdminUsersTable.jsx
// -----------------------------------------------------------------------------
// Users management: role toggle + block toggle (super admin is protected).
// =============================================================================

import { useState } from "react";
import api from "../api/client";
import { MAX_FAILED_ATTEMPTS } from "./adminSections";

export default function AdminUsersTable({ users, adminId, onChanged }) {
  const [error, setError] = useState("");

  async function setRole(id, isAdmin) {
    try {
      await api.put(`/admin/users/${id}/role`, { admin_id: adminId, is_admin: isAdmin });
      onChanged();
    } catch (error) {
      setError(error.response?.data?.message || error.message);
    }
  }

  async function setBlocked(id, blocked) {
    try {
      await api.put(`/admin/users/${id}/block`, { admin_id: adminId, blocked });
      onChanged();
    } catch (error) {
      setError(error.response?.data?.message || error.message);
    }
  }

  return (
    <section className="post-card">
      <h3>Users ({users.length})</h3>
      {error && <p className="error">{error}</p>}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th><th>Username</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const blocked = (u.failed_attempts ?? 0) >= MAX_FAILED_ATTEMPTS;
              const role = u.is_super_admin ? "super admin" : u.is_admin ? "admin" : "user";
              return (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.username}</td>
                  <td>{u.email}</td>
                  <td>{role}</td>
                  <td>{blocked ? "🔒 blocked" : "active"}</td>
                  <td>
                    {u.is_super_admin ? (
                      <span className="muted">protected</span>
                    ) : (
                      <span className="row">
                        {u.is_admin ? (
                          <button onClick={() => setRole(u.id, false)}>Remove admin</button>
                        ) : (
                          <button onClick={() => setRole(u.id, true)}>Make admin</button>
                        )}
                        {blocked ? (
                          <button onClick={() => setBlocked(u.id, false)}>Unblock</button>
                        ) : (
                          <button className="danger" onClick={() => setBlocked(u.id, true)}>Block</button>
                        )}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
