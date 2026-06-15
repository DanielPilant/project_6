// =============================================================================
// pages/protected/Admin.jsx — admin dashboard (advanced stage)
// -----------------------------------------------------------------------------
// Visible only to admins. Loads the WHOLE database in one call and lets the
// admin manage users (promote/demote, block/unblock) and edit/delete any
// content. The super admin is protected (no role/block buttons).
//
//   GET    /admin/data?admin_id=
//   PUT    /admin/users/:id/role     { admin_id, is_admin }
//   PUT    /admin/users/:id/block    { admin_id, blocked }
//   PUT    /admin/:resource/:id      { admin_id, ...fields }
//   DELETE /admin/:resource/:id?admin_id=
// =============================================================================

import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "../../api/client";
import { getCurrentUser } from "../../auth/auth";

const MAX_FAILED_ATTEMPTS = 10; // mirrors the backend block threshold

// Column config per content resource (drives display + which fields are editable).
const SECTIONS = [
  {
    resource: "todos",
    title: "Todos",
    columns: [
      { key: "id", label: "ID" },
      { key: "user_id", label: "Owner" },
      { key: "title", label: "Title", editable: true },
      { key: "completed", label: "Done" },
    ],
  },
  {
    resource: "posts",
    title: "Posts",
    columns: [
      { key: "id", label: "ID" },
      { key: "user_id", label: "Owner" },
      { key: "title", label: "Title", editable: true },
      { key: "body", label: "Body", editable: true },
    ],
  },
  {
    resource: "comments",
    title: "Comments",
    columns: [
      { key: "id", label: "ID" },
      { key: "post_id", label: "Post" },
      { key: "user_id", label: "Owner" },
      { key: "name", label: "Name", editable: true },
      { key: "body", label: "Body", editable: true },
    ],
  },
  {
    resource: "albums",
    title: "Albums",
    columns: [
      { key: "id", label: "ID" },
      { key: "user_id", label: "Owner" },
      { key: "title", label: "Title", editable: true },
    ],
  },
  {
    resource: "photos",
    title: "Photos",
    columns: [
      { key: "id", label: "ID" },
      { key: "album_id", label: "Album" },
      { key: "title", label: "Title", editable: true },
      { key: "url", label: "URL", editable: true },
    ],
  },
];

export default function Admin() {
  const admin = getCurrentUser();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  async function loadData() {
    try {
      const { data } = await api.get("/admin/data", {
        params: { admin_id: admin.id },
      });
      setData(data);
    } catch (error) {
      setError(`Failed to load admin data: ${error.response?.data?.message || error.message}`);
    }
  }

  // Only an admin loads the data (hooks must run unconditionally, so the guard
  // is inside the effect and the early return below comes AFTER all hooks).
  useEffect(() => {
    if (admin?.is_admin) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Defensive guard: non-admins never get the nav link, but if someone types
  // the URL, bounce them out.
  if (!admin?.is_admin) {
    return <Navigate to={`/users/${admin?.username}/posts`} replace />;
  }

  if (error) return <p className="error">{error}</p>;
  if (!data) return <p className="muted">Loading…</p>;

  return (
    <div className="placeholder admin">
      <h2>Admin dashboard</h2>

      <UsersTable users={data.users} adminId={admin.id} onChanged={loadData} />

      {SECTIONS.map((section) => (
        <AdminSection
          key={section.resource}
          {...section}
          items={data[section.resource]}
          adminId={admin.id}
          onChanged={loadData}
        />
      ))}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Users management: role toggle + block toggle (super admin is protected).
// -----------------------------------------------------------------------------
function UsersTable({ users, adminId, onChanged }) {
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

// -----------------------------------------------------------------------------
// Generic content section: a table with inline edit (editable columns) + delete.
// -----------------------------------------------------------------------------
function AdminSection({ resource, title, columns, items, adminId, onChanged }) {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({});
  const [error, setError] = useState("");

  const editableKeys = columns.filter((c) => c.editable).map((c) => c.key);

  function startEdit(item) {
    setEditingId(item.id);
    const d = {};
    editableKeys.forEach((k) => (d[k] = item[k]));
    setDraft(d);
  }

  async function save(id) {
    try {
      await api.put(`/admin/${resource}/${id}`, { admin_id: adminId, ...draft });
      setEditingId(null);
      onChanged();
    } catch (error) {
      setError(error.response?.data?.message || error.message);
    }
  }

  async function remove(id) {
    try {
      await api.delete(`/admin/${resource}/${id}`, { params: { admin_id: adminId } });
      onChanged();
    } catch (error) {
      setError(error.response?.data?.message || error.message);
    }
  }

  return (
    <section className="post-card">
      <h3>{title} ({items.length})</h3>
      {error && <p className="error">{error}</p>}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              {columns.map((c) => <th key={c.key}>{c.label}</th>)}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                {columns.map((c) => (
                  <td key={c.key}>
                    {editingId === item.id && c.editable ? (
                      <input
                        value={draft[c.key] ?? ""}
                        onChange={(e) => setDraft({ ...draft, [c.key]: e.target.value })}
                      />
                    ) : (
                      String(item[c.key] ?? "")
                    )}
                  </td>
                ))}
                <td>
                  <span className="row">
                    {editingId === item.id ? (
                      <>
                        <button onClick={() => save(item.id)}>Save</button>
                        <button onClick={() => setEditingId(null)}>Cancel</button>
                      </>
                    ) : (
                      <button onClick={() => startEdit(item)}>Edit</button>
                    )}
                    <button className="danger" onClick={() => remove(item.id)}>Delete</button>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
